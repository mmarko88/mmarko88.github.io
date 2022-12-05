---
title: "How to unzip input stream in java"
date: 2022-11-20
draft: true
usePageBundles: true
featureImage: 'extract_zip.png' # Top image on post.
featureImageAlt: 'Extracting zip input stream in java' # Alternative text for featured image.
shareImage: 'extract_zip.png' # For SEO and social media snippets.
---

## Introduction
In this article I'm going to show you how to extract zip archive in Java. Although, there are a lot of articles on this subject already online, this article will face this problem from another angle. 

Most of the articles are just concerned about the algorithm and how to use Java classes to unzip the archive. I will try to explain you here the same, but I will show you full implementation in Java way.

As I said, the first best practice in Java, when creating a solution for some problem is to define the problem. This is usually done by defining a contract (interface) between clients and service.

Most of the existing articles about unzipping archive in Java are describing how to unzip a file. If you are receiving input stream from some source, then it is not performant to store it on the file system and read it again. Even on SSD era, accessing file storage is much slower that having the data in RAM memory.

So, let's first define interface.
## Interface

```java
public interface ExtractZipStream {
    List<FileContainer> extract(byte[] data) throws IOException;
    void extract(byte[] data, Consumer<FileContainer> extractedFileConsumer) throws IOException;

    List<FileContainer> extract(InputStream zipStream) throws IOException;
    void extract(InputStream zipStream, Consumer<FileContainer> extractedFileConsumer) throws IOException;
}
```

This interface contains four methods, and they are all variations for the same job, but depending on the client use case, they are created for easier interaction with the service.

Two methods return list of extracted files and they can be used when extracted files can fit in memory. We can extract byte array or input stream.

Other two methods accepts additional `Consumer` parameter that will be invoked each time when zip entry is extracted. By doing this, you can process each file individually and this will allow you to save memory.

All the services return multiple instances of `FileContainer` class which is just a `Record` that contains file name and content, as we can see in the following code snippet:

```java
public record FileContainer(byte[] fileContent, String fileName) {
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FileContainer that = (FileContainer) o;
        return fileName.equals(that.fileName);
    }

    @Override
    public int hashCode() {
        return fileName.hashCode();
    }

    @Override
    public String toString() {
        return "FileContainer{" +
                "fileName='" + fileName + '\'' +
                '}';
    }
}
```

<mark>This is important!!!</mark> Always override methods `equals`,`hashCode` and `toString` when you have a class with array with unknown size! Why? 
1. `toString` can generate big logs that are mostly unusable and big.
2. `hashCode` and `equals` will consume more CPU to calculate value and thus slowing down your performance.

## Extracting a zip file

### Good practices
1. Limit the size of extracted archive.  
Everything is limited, so in order not to destroy our server, we should be careful.
2. Limit the number of entries in an archive.
3. Limit the size of individual entry in an archive.
4. Protect yourself against zip bomb. (check entry compression ratio).
5. Forbid folders inside a zip archive (avoid recursion).

Let's describe implementation and let's start with the public methods implementing the interface:

```java
  public List<FileContainer> extract(byte[] data) throws IOException {
      try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data)) {
          return extract(byteArrayInputStream);
      }
  }

  public void extract(byte[] data, Consumer<FileContainer> extractedFileConsumer) throws IOException {
      try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data)) {
          extract(byteArrayInputStream, extractedFileConsumer);
      }
  }

  public List<FileContainer> extract(InputStream zipStream) throws IOException {
      List<FileContainer> files = new ArrayList<>();
      extract(zipStream, files::add);
      return files;
  }

  public void extract(InputStream zipStream, Consumer<FileContainer> extractedFileConsumer) throws IOException {
      try (ZipInputStream zipInputStream = new ZipInputStream(zipStream)) {
          processZipInputStream(zipInputStream, extractedFileConsumer);
      }
  }
```

As we can see, each of those methods converts input data in some way and calls boils down to the last method as it is most abstract and generic. This method opens zip input stream and gives responsibility to another method `processZipInputStream` processes zip input stream and for each uncompressed zip entry(file) it calls the consumer method provided as the second parameter. 

```java
  private void processZipInputStream(ZipInputStream zipInputStream,
                                     Consumer<FileContainer> extractedFileConsumer) throws IOException {
      Buffer buffer = new Buffer(bufferSize);
      ArchiveSizeMeter archiveSizeMeter = new ArchiveSizeMeter();
      ZipEntry entry;
      while ((entry = zipInputStream.getNextEntry()) != null) {
          ExtractContext extractContext =
                  new ExtractContext(zipInputStream, archiveSizeMeter, buffer, entry);
          FileContainer fileContainer = extractZipEntryWithChecks(extractContext);
          zipInputStream.closeEntry();
          extractedFileConsumer.accept(fileContainer);
      }
  }
```

The way to process zip input stream is to fetch next entry in the loop until it doesn't return null. It would be much nicer if it returns iterator for zip entries. Sadly, there is no such thing, and we need to do it in the 'old' way. But, it is not enough just to get entry from the `ZipInputStream`, we need to read the content for it also. In this case, we can imagine entry as a key to get the data from input stream.

We can also see some new classes here in this code. Let me explain them all:

### Buffer
As we don't know the file size of the input stream we need ways to read input stream content. If we choose too big buffer, they will consume server memory more than needed. On the other hand, small buffer sizes can decrease extracting performance. That is the reason we have the size as the parameter where you can set it up to be loaded from the application configuration.


#### Digression: So buffer can be memory heavy, should we then initialize it on the class level? 

Short answer, NO. 
The biggest problem with this approach would be concurrency problems. What would happen if you call file extraction from two different threads? Buffer will be unusable.
Java garbage collectors are much faster those days, why not use that power for our benefit? :)


Let me show you the code of the Buffer class:

```java
class Buffer {
  // DANGER: this buffer can be big
  final byte[] bufferContent;
  int dataLength;

  public Buffer(int size) {
      bufferContent = new byte[size];
  }

  public int getBufferSize() {
      return dataLength;
  }

  public int read(ZipInputStream zipInputStream) throws IOException {
      int nBytesRead = zipInputStream.read(bufferContent);
      dataLength = nBytesRead;
      return nBytesRead;
  }
  
  public void writeTo(ByteArrayOutputStream out) {
      out.write(bufferContent, 0, dataLength);
  }
 
}
```
So the main purpose of the `Buffer` class is to make our lives easier when it comes to extracting zip input stream.

It contains buffer represented as a byte array. This buffer should not be included in methods such as `hashCode`, `equals` or `toString` as it can cause performance problems.

Data length is different from the `bufferContent.length` and it has size `<= bufferContent.length` as represents number of meaningful bytes in the buffer. 

There two additional functions for reading from a zip input stream and writing the content to a byte array output stream.

### Archive size meter

On the server environment, everything is limited, and we don't want to kill the server while trying to extract big archive. Usually, you can agree with business for maximum file size that can be extracted and protect yourself from malicious user. This is also true for the number of items in an archive.

```java
class ArchiveSizeMeter {
  private long totalSizeArchive = 0;
  private long totalItemsArchive = 0;

  public void addArchiveSize(long size) {
      totalSizeArchive += size;
  }
  public void incItem() {
      totalItemsArchive++;
  }

  public long getTotalItemsArchive() {
      return totalItemsArchive;
  }

  public long getTotalSizeArchive() {
      return totalSizeArchive;
  }
}
```

### Extract context

```java
  private record ExtractContext(
          ZipInputStream zipInputStream,
          ArchiveSizeMeter archiveSizeMeter,
          Buffer buffer,
          ZipEntry entry) { }
```
All of those parameters goes together in further methods for processing. So it is a good idea to group them and create simpler interface for further methods. This is a private data structure and it is not visible outside the service.

## Extracting a Zip entry

### Checks for zip entry
This is the first place in extraction process where we can check some thresholds.
1. Not a directory  
This is the easy check, just call `entry.isDirectory()` and it will return `true` if the current entry is directory. We will throw exception to the user with the appropriate message.
2. Number of entries  
We cannot get number of entries upfront when extracting input stream. So, we need to count them manually and check if the threshold for entries is exceeded.

```java
  private FileContainer extractZipEntryWithChecks(ExtractContext context) throws IOException {
      checkNotDirectory(context.entry());
      ArchiveSizeMeter archiveSizeMeter = context.archiveSizeMeter();
      archiveSizeMeter.incItem();
      sizeChecker.checkThresholdEntries(archiveSizeMeter);
      return extractZipEntry(context);
  }

  private static void checkNotDirectory(ZipEntry entry) {
      if (entry.isDirectory()) {
          throw new IllegalArgumentException("Folders inside zip archive are not supported.");
      }
  }
```
### Extract zip entry
Finally, we are at the code for extracting zip entry. Decompression is done by coping entry data from input stream to byte array output stream. When copying is done, we just get byte array from output stream. That data is packed into file container along with entry name and it is returned to the user.

Decompressing and coping zip input stream is actually the most dangerous action that we do in code. We need to perform several checks after each reading of zip input stream. Because of that `checkThresholds` method is called in the code.
```java
  private FileContainer extractZipEntry(ExtractContext context) throws IOException {
      ZipEntry entry = context.entry();
      EntrySizeMeter entrySizeMeter = new EntrySizeMeter(entry.getCompressedSize());
      try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
          copyToOutStreamWithThresholdChecks(context, out, entrySizeMeter);

          byte[] fileContent = out.toByteArray();
          return new FileContainer(fileContent, entry.getName());
      }
  }
  private void copyToOutStreamWithThresholdChecks(ExtractContext context,
                                                  ByteArrayOutputStream out,
                                                  EntrySizeMeter entrySizeMeter) throws IOException {
      Buffer buffer = context.buffer();
      ZipInputStream zipInputStream = context.zipInputStream();

      while (buffer.read(zipInputStream) > 0) {
          buffer.writeTo(out);
          checkThresholds(context, entrySizeMeter);
      }
  }
```

### Stream copy thresholds
This method checks thresholds that can be exceeded during extraction process. We are checking archive size, entry size and compression ratio.
```java
  private void checkThresholds(ExtractContext context,
                               EntrySizeMeter entrySizeMeter) {
      Buffer buffer = context.buffer();
      ZipEntry entry = context.entry();
      entrySizeMeter.addEntrySize(buffer.getBufferSize());
      sizeChecker.checkThresholdEntrySize(entrySizeMeter, entry.getName());
      sizeChecker.checkThresholdCompressionRatio(entrySizeMeter, entry.getName());

      ArchiveSizeMeter archiveSizeMeter = context.archiveSizeMeter;
      archiveSizeMeter.addArchiveSize(buffer.getBufferSize());
      sizeChecker.checkThresholdTotalSize(archiveSizeMeter);
  }
```

### Whole code
````java
public class ExtractZipStreamImpl implements ExtractZipStream {
    private final SizeChecker sizeChecker;
    private final int bufferSize;

    public ExtractZipStreamImpl(SizeChecker sizeChecker, int bufferSize) {
        this.sizeChecker = sizeChecker;
        this.bufferSize = bufferSize;
    }

    public List<FileContainer> extract(byte[] data) throws IOException {
        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data)) {
            return extract(byteArrayInputStream);
        }
    }

    public void extract(byte[] data, Consumer<FileContainer> extractedFileConsumer) throws IOException {
        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data)) {
            extract(byteArrayInputStream, extractedFileConsumer);
        }
    }

    public List<FileContainer> extract(InputStream zipStream) throws IOException {
        List<FileContainer> files = new ArrayList<>();
        extract(zipStream, files::add);
        return files;
    }

    public void extract(InputStream zipStream, Consumer<FileContainer> extractedFileConsumer) throws IOException {
        try (ZipInputStream zipInputStream = new ZipInputStream(zipStream)) {
            processZipInputStream(zipInputStream, extractedFileConsumer);
        }
    }

    private record ExtractContext(
            ZipInputStream zipInputStream,
            ArchiveSizeMeter archiveSizeMeter,
            Buffer buffer,
            ZipEntry entry) {
    }

    private void processZipInputStream(ZipInputStream zipInputStream,
                                       Consumer<FileContainer> extractedFileConsumer) throws IOException {
        Buffer buffer = new Buffer(bufferSize);
        ArchiveSizeMeter archiveSizeMeter = new ArchiveSizeMeter();
        ZipEntry entry;
        while ((entry = zipInputStream.getNextEntry()) != null) {
            ExtractContext extractContext =
                    new ExtractContext(zipInputStream, archiveSizeMeter, buffer, entry);
            FileContainer fileContainer = extractZipEntryWithChecks(extractContext);
            zipInputStream.closeEntry();
            extractedFileConsumer.accept(fileContainer);
        }
    }

    private FileContainer extractZipEntryWithChecks(ExtractContext context) throws IOException {
        checkNotDirectory(context.entry());
        ArchiveSizeMeter archiveSizeMeter = context.archiveSizeMeter();
        archiveSizeMeter.incItem();
        sizeChecker.checkThresholdEntries(archiveSizeMeter);
        return extractZipEntry(context);
    }

    private static void checkNotDirectory(ZipEntry entry) {
        if (entry.isDirectory()) {
            throw new IllegalArgumentException("Folders inside zip archive are not supported.");
        }
    }

    private FileContainer extractZipEntry(ExtractContext context) throws IOException {
        ZipEntry entry = context.entry();
        EntrySizeMeter entrySizeMeter = new EntrySizeMeter(entry.getCompressedSize());
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            copyToOutStreamWithThresholdChecks(context, out, entrySizeMeter);

            byte[] fileContent = out.toByteArray();
            return new FileContainer(fileContent, entry.getName());
        }
    }
    private void copyToOutStreamWithThresholdChecks(ExtractContext context,
                                                    ByteArrayOutputStream out,
                                                    EntrySizeMeter entrySizeMeter) throws IOException {
        Buffer buffer = context.buffer();
        ZipInputStream zipInputStream = context.zipInputStream();

        while (buffer.read(zipInputStream) > 0) {
            buffer.writeTo(out);
            checkThresholds(context, entrySizeMeter);
        }
    }

    private void checkThresholds(ExtractContext context,
                                 EntrySizeMeter entrySizeMeter) {
        Buffer buffer = context.buffer();
        ZipEntry entry = context.entry();
        entrySizeMeter.addEntrySize(buffer.getBufferSize());
        sizeChecker.checkThresholdEntrySize(entrySizeMeter, entry.getName());
        sizeChecker.checkThresholdCompressionRatio(entrySizeMeter, entry.getName());

        ArchiveSizeMeter archiveSizeMeter = context.archiveSizeMeter;
        archiveSizeMeter.addArchiveSize(buffer.getBufferSize());
        sizeChecker.checkThresholdTotalSize(archiveSizeMeter);
    }
}
````
