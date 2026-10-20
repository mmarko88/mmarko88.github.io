---
title: "Safe Zip Extraction in Java: Zip Slip, Bombs, Limits"
date: 2022-12-06
toc: true
draft: false
usePageBundles: true
description: "Zip Slip, zip bombs, size limits, entry counts, memory caps. Six thresholds every Java zip-extraction routine should enforce before touching disk or memory."
featureImage: 'extract_zip.webp' # Top image on post.
featureImageAlt: 'Best practices that you should follow when extracting zip archive in Java' # Alternative text for featured image.
shareImage: 'share.png' # Branded 1200x630 social-share card.
featured: true
tags: ["zip", "java"]
categories: [ "java"]
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/extract-zip-stream'
---
Extracting archive files without controlling resource consumption is security-sensitive and can lead to denial of service.

Our code executes on servers, but you should know that servers have limits. Based on this, check how many hardware resources your code can consume. Resources are CPU, RAM, disk, network... Understand those limits and, based on those limits, put thresholds in your code.

Here are some important thresholds you should put in a code when extracting a zip archive — in
the order they should fire during extraction:

```mermaid
flowchart LR
    A[Open zip stream] --> B{Entry count<br/>under limit?}
    B -- no --> X[Abort: entry bomb]
    B -- yes --> C{Entry path<br/>safe?}
    C -- "../ or absolute" --> X2[Abort: zip slip]
    C -- safe --> D{Entry extension<br/>allow-listed?}
    D -- no --> X3[Abort: unsafe type]
    D -- yes --> E[Read bytes in chunks]
    E --> F{Running total<br/>under max size?}
    F -- no --> X4[Abort: size bomb]
    F -- yes --> G{Chunk still<br/>safe to decompress?}
    G -- compression ratio too high --> X5[Abort: zip bomb]
    G -- ok --> H[Write to disk]
    H --> E
    E -. all entries done .-> Z[Done]
```

### 1. Limit the size of an extracted archive
This is the most basic and critical threshold you should introduce when extracting a zip archive.

#### How to limit extracted size?
You can check the size after you extract the archive, but this can be too late. If the extracted content is too big, it can drain your server resources.

You should include a size threshold check in the extraction process. Each time you extract and get some bytes from an archive, compare the total extracted size with the threshold.

Zip archives also have metadata. In metadata, you can find each entry's file size. But, as another application wrote metadata, this information doesn't need to be correct.

### 2. Limit the number of entries in an archive
Each file system has some limitations in terms of the number of files and directories that can handle in a directory/partition/hard drive... Those limits are usually huge numbers. Even so, this is a limited resource. In the [Sonar article](https://rules.sonarsource.com/java/type/Security%20Hotspot/RSPEC-5042) there is the following statement:

``Too many entries in an archive, can lead to inodes exhaustion of the system.``

Inodes are indexes that point to the actual location of a file on a disk. If you have too many small files on the file system, it can drain out available inodes. Consequently, your system cannot store new files.

Inodes are used on the linux/unix file systems, but a similar limit also exists for windows. Source: [stackoverflow](https://stackoverflow.com/a/7163783).

### 3. Protect yourself against zip bomb

``Successful Zip Bomb attacks occur when an application expands untrusted archive files without controlling the size of the expanded data, which can lead to denial of service.`` Source: [Sonar article](https://rules.sonarsource.com/java/type/Security%20Hotspot/RSPEC-5042)

A Zip bomb is usually a malicious archive file of a few kilobytes with extracted content measured in gigabytes. To achieve this extreme compression ratio, attackers will compress irrelevant data (e.g., a long string of repeated bytes).

You can have a total archive file size threshold, but you should always strive to fail fast. The compression ratio can give you an idea of whether the data in the archive is relevant. The data compression ratio for most legit archives is 1 to 3. And in the example from the sonar article threshold is 10, which should be a good value.

[Here](https://www.bamsoftware.com/hacks/zipbomb/) you can find example zip bomb files.

### 4. Sanitize zip files
Sure, here is the revised version in Markdown format with grammatical corrections:

1. **Run a virus scan on a zip file before performing any other action.**

   This can help prevent malicious files from being uploaded and potentially causing harm to the server or other users.

2. **Check the content of the zip archive.**

   The content of a zip archive is stored sequentially as a sequence of bytes,
   followed by a central directory at the end of the file.
   The central directory contains metadata about all zip content.
   For each file, it contains a relative path inside the zip archive.
   This can create a problem as it can allow a ZipSlip attack
   because a user can enter the file name in the form `..\..\file`,
   leading to the extraction of a zip file in an unwanted location.

   To fix this, add the following check: the **canonical** path of the entry does not start
   with the **canonical** path of the target directory — comparing as `Path`, not as `String`.

   ```java
   File extractedFile = new File(extractDirPath, zipEntry.getName());
   Path basePath   = new File(extractDirPath).getCanonicalFile().toPath();
   Path targetPath = extractedFile.getCanonicalFile().toPath();
   if (!targetPath.startsWith(basePath)) {
       throw new SecurityException("ZipEntry outside target folder: " + zipEntry.getName());
   }
   ```

   Two subtle details that defeat real attackers:
   - **`getCanonicalFile()` on both sides** resolves symlinks and `..` segments. If the
     target directory itself is a symlink to another location (or if your runtime user
     later renames it), a non-canonical compare lets the attacker out.
   - **`Path.startsWith(Path)` not `String.startsWith(String)`** — the string compare treats
     `/tmp/safe` as a prefix of `/tmp/safe-evil/malicious.txt`. The `Path` compare matches
     only on complete path segments.

3. **Check file extensions inside the zip file.**

   They should match the file extensions that are allowed by your application.

4. **Change the filename to something generated by the application.**

   You can use UUID to generate the file name.
   This can help prevent conflicts between files and make it harder for an attacker to predict filenames,
   which can be useful in certain types of attacks.

### 5. Don't extract archives inside an archive

This will also create the same problem as with extracting folder content. It is better to go with one of the following options:

1. Treat archive files in the archive as all other files - don't extract them.
2. Check with the business if you can forbid the archive files inside an archive. You can ask this question because compressing an already compressed archive will not lead to a smaller file. \
   You can forbid archive entries by checking entry extension and mime type during the extraction process.

### 6. Don't rely only on archive entry metadata

Archives contain metadata that you can read during the extraction process. Compressing application wrote this data in an archive during the compression process.

The problem with this is that if you rely only on those properties, you need to trust a compressing application that is not in your control. Hackers can create fake metadata and crush your application.

Be careful when using zip archive metadata. Always ask yourself how attackers can abuse it to hack your extraction algorithm.

### 7. Hardenings I learned the hard way (production fixes)

The six items above cover the headline attacks. These five smaller details fixed real-world
findings in production code I maintain:

1. **Decode zip filenames with Cp437, not UTF-8.** The default `ZipInputStream` constructor
   assumes UTF-8; a hostile zip with filenames in another encoding throws
   `IllegalArgumentException` mid-stream and leaves half the archive extracted.

   ```java
   try (ZipInputStream zip = new ZipInputStream(input, Charset.forName("Cp437"))) { ... }
   ```

2. **Check the compression ratio inside the extraction loop, not after.** Checking only
   after writing the whole entry means a zip bomb has already written its gigabytes to disk
   by the time you notice.

   ```java
   while ((n = zip.read(buffer)) > 0) {
       out.write(buffer, 0, n);
       totalEntrySize += n;
       long compressed = entry.getCompressedSize();
       if (compressed > 0 && (double) totalEntrySize / compressed > thresholdRatio) {
           throw new SecurityException("Compression ratio exceeded on " + entry.getName());
       }
   }
   ```

3. **Fall back to the global size cap when `entry.getCompressedSize()` returns -1.** The ZIP
   format doesn't require compressed size to be present in the local header; some creators
   leave it as `-1` (unknown). Without a fallback, your ratio check silently skips those
   entries. Pattern:

   ```java
   if (compressed > 0) {
       // ratio check as above
   } else if (totalEntrySize > thresholdSize) {
       throw new SecurityException("Oversized unknown-ratio entry: " + entry.getName());
   }
   ```

4. **Skip directory entries explicitly.** `entry.isDirectory()` returns `true` for entries
   whose name ends in `/`. If you don't skip them, you'll try to open a file at a directory
   path and hit a confusing I/O error later.

   ```java
   if (entry.isDirectory()) { zip.closeEntry(); continue; }
   ```

5. **Clean up on exception.** If any threshold trips mid-archive, half the files are already
   on disk. Wrap the whole extraction in a try/catch and delete the output directory on any
   failure — otherwise you accumulate half-extracted archives from failed uploads.

   ```java
   try {
       // extract loop
   } catch (Exception e) {
       FileUtils.deleteDirectoryQuietly(outputDir);
       throw e;
   }
   ```

All five of these are in the `blog-examples` reference implementation linked at the top of
the post — the simpler variants in sections 1–6 are the clean teaching versions; the full
code reflects what shipped.

## What's the current best practice?

I keep updating this post as I run into fresh pitfalls. The 2026 version of my advice looks
like this.

### Should you use the JDK or a library?

For most teams: **`java.util.zip.ZipInputStream` from the JDK, with every hardening in this
post, is the right answer.** It's audited, zero-dependency, and the attack surface is
narrow. The hardenings do the heavy lifting; the library choice doesn't.

Reach for a third-party library only when you have a concrete feature need:

| Library | Reach for it when… | Still need the hardenings? |
|---------|-------------------|---------------------------|
| `java.util.zip` (JDK) | Default — plain Deflate zips, no exotic features | **Yes** |
| [Apache Commons Compress](https://commons.apache.org/proper/commons-compress/) | PPMd, LZMA, Zstandard entries · tar/7z/bzip2 formats · better split-zip support | **Yes** — library doesn't block zip bombs by default |
| [zip4j](https://github.com/srikanth-lingala/zip4j) | AES-encrypted zips · multi-threaded compression · simpler API if you're writing a tool | **Yes** — same |

One trap worth calling out: `java.util.zip.ZipFile` (random-access, needs a `File` on disk)
decompresses the central directory into memory on open, before you've validated anything.
On untrusted uploads prefer `ZipInputStream` which processes entries sequentially — you can
abort before the directory parsing finishes.

### Defense in depth around the extractor

The extractor itself is only one layer. In 2026 production systems:

1. **Antivirus scan first.** Run ClamAV (or a managed scanner) over the raw bytes before
   extraction. Many zip bombs are blocked by signature.
2. **Extract into a sandbox.** A tmpfs mount with a hard size cap, a disposable container,
   or a dedicated worker process. Even with every check in this post, running extraction
   in the same JVM as your API is a bigger blast radius than you need.
3. **Separate privileges.** The process that extracts should not have the same filesystem
   or network permissions as the process that serves user traffic.
4. **Log every rejection.** When your thresholds trip, you want to know (metric + trace
   context). Repeated rejections from the same source are a signal, not noise.
5. **Reconsider whether you need to extract at all.** If you only need metadata or a
   subset of entries, parse the central directory without decompressing — most archive
   libraries let you list entries without reading their bytes.
6. **If you handle sensitive uploads**, look at a Content Disarm &amp; Reconstruction (CDR)
   service. These rebuild documents from scratch, dropping anything that doesn't match a
   known-good schema. More expensive, but immune to the attacks in this post.

### What changed since this post was first published

- **2022** — Original post, six sections.
- **2024** — I kept hitting production issues the original examples didn't cover; added
  Section 7 with the Cp437 charset, inside-loop ratio check, `-1` compressed-size fallback,
  directory skip, and cleanup-on-exception.
- **2026** — Added this follow-up on library choice and defense in depth. The hardenings
  haven't changed much; what has changed is the ecosystem's expectations about *where*
  extraction runs (sandboxes, dedicated workers, AV scanning).

If you spot something I've missed, [open an issue](https://github.com/mmarko88/blog-examples/issues) —
I treat this as a living post.

## Test yourself

{{< quiz question="What is the correct way to defend against Zip Slip?" options="Resolve the canonical path of the target file|Verify the canonical target starts with the canonical destination directory|Trust the entry name because the zip was uploaded by an authenticated user|Reject only entries whose name contains the literal string ../" correct="0,1" multi="true" explanation="Resolve the canonical path of each extracted file and confirm it still starts with the canonical destination directory. String checks for ../ are easily bypassed, and trusting the source is never a defense." >}}

## Related reading

- [What Is Memory Churn and How to Avoid It in Java](/post/java/memory_churn/) — the extraction
  loop allocates one `ZipEntry` per iteration; same cache-locality thinking applies.
- [Fastest MS SQL Inserts — Part 2: JDBC Strategies](/post/java/mssqlserver/fast_insert_part2/) —
  bulk-inserting the extracted file metadata into a database uses the same batch-size reasoning
  as these thresholds.

#### Sources:
1. [Wikipedia](https://en.wikipedia.org/wiki/ZIP_%28file_format%29)
2. [The Risk of Archive Extraction](https://www.sonarsource.com/blog/the-hidden-flaws-of-archives-in-java/)
3. [OWASP - File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)