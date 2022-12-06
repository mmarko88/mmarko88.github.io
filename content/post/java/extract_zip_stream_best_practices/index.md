---
title: "Best Practices That You Should Follow When Extracting Zip Archive in Java"
date: 2022-12-06
draft: false
usePageBundles: true
featureImage: 'extract_zip.jpg' # Top image on post.
featureImageAlt: 'Best practices that you should follow when extracting zip archive in Java' # Alternative text for featured image.
shareImage: 'extract_zip.jpg' # For SEO and social media snippets.
---
Extracting archive files without controlling resource consumption is security-sensitive and can lead to denial of service.

Our code executes on servers, but you should know that servers have limits. Based on this, check how many hardware resources your code can consume. Resources are CPU, RAM, disk, network... Understand those limits and, based on those limits, put thresholds in your code.

Here are some important thresholds you should put in a code when extracting a zip archive.

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

### 4. Forbid folders inside an archive.

Check with your business people if you can forbid folders inside an archive. In return, you will avoid recursion in the code.

#### Why is this important?
1. If you don't implement recursion properly, it can break your application in many ways.
2. It will also add extra complexity to your code, which can lead to bugs.
3. It will take more work to understand the logic of the code.
4. it will be harder to maintain that code.

In a server environment, using recursion is dangerous! If you need to implement recursion, please be extra careful!

### 5. Don't extract archives inside an archive

This will also create the same problem as with extracting folder content. It is better to go with one of the following options:

1. Treat archive files in the archive as all other files - don't extract them.
2. Check with the business if you can forbid the archive files inside an archive. You can ask this question because compressing an already compressed archive will not lead to a smaller file. \
   You can forbid archive entries by checking entry extension and mime type during the extraction process.

### 6. Don't rely only on archive entry metadata

Archives contain metadata that you can read during the extraction process. Compressing application wrote this data in an archive during the compression process.

The problem with this is that if you rely only on those properties, you need to trust a compressing application that is not in your control. Hackers can create fake metadata and crush your application.

Be careful when using zip archive metadata. Always ask yourself how attackers can abuse it to hack your extraction algorithm.

