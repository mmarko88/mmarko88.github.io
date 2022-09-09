---
title: "Getting started with docker"
date: 2022-07-20
draft: true
usePageBundles: true
featureImage: 'fp_in_java.png' # Top image on post.
featureImageAlt: 'How do I become proficient with functional programming in Java' # Alternative text for featured image.
shareImage: 'fp_in_java.png' # For SEO and social media snippets.
---
## What is the kernel really doing to create container.
Two primary technologies going into this

1. namespaces
2. cgroups

### Linux namespaces
Namespaces provide isolation inside container. This is what makes processes isolated. Kernel provides isolation.
How are those processes isolated? 6 Namespaces that provides isolation.

* Mount (filesystem resources)
* UTS (host & domain name)
* IPC (hared memory, semaphores)
* PID (process tree)
* Network (network layer)
* User (user and group IDs)
* Time (clock offsets) not a fuly namespace - not really aloved to set a time for container but you can set clock offset Linux 5.6+ (2020)

### Control Groups (cgroups)
Control groups let's you implement metering and limiting on the resources used by processes. You can limit memory, IO, network IO... Each subsystem like CPU, memory... has it's own hiearchy which looks like a tree with nodes and each process belongs to one node in each hiearchi.

Generalities

* Each subsystem has a hierarchy (tree)
- separate hierarchies for CPU, memory block I/O...
* Hierarchies are independent
- the trees for e.g. memory and CPU can be different
* Each process is in a node in each hierarchy
- think of each hierarchy as a different dimension or axis
* Each hierarchy starts with 1 node (the root)
* Initially, all processes start at the root node*
* Each node = group of processes
  sharing the same resources
* It's a bit more subtle;

Which means, even if you are not using containers on your machine, you still are in a containers. Your whole machine is a container with no limits. If you think you can go faster by not beeing in container, you will not be right, because you are still in a container.

image::image-2022-03-23-23-07-09-784.png[Example]

* Resource limiting
* Prioritization
* Accounting
* Control


docker container run -it --pid=host spkane/alpine-base:latest sh
--pid=host -- removing isolation from the container. Use host pid namespace. It will be able to see all process ids from the host.

Limit the number of cores
pefore image add parameter --cpus="2"

### Memory quoatas
--memory="512m"


docker container run -it --priviliged --pid=host debian nsenter -ti -m -u -n -i sh

=== Disc allocation
--device-write-iops (writing operations per second) /dev/vda
--device-write-iops <dev_name)
there should be command
--device-read-iops

-device-write-bps /dev/vda:5mb

## Security
1. Who you are running as inside your container?


docker container run spkane/train-os:latest whoami
root

linux administrative user

You are the boss inside container. Problem are security exploits in docker and linux kernel.

Generally it is a bad practice to run stuff as privileged user inside container!

When you have files mounted into your container. For example, you have /etc directory mounted (very, very bad practice).

## Local store
mount some local files and directories into container

Useful for development, not for production

git clone https://github.com/spkane/docker-volumes-example.git

docker container run --rm --publish mode=ingress,published=18080,targed=80 --mount type=bind,source=/Users/spane/class/docker-volumes-example/volumes/single-file,target=/usr/local/apache2/htdocs/images/1.jpg



## Docker container stats
docker container stats resource usages

docker container stats <container_name>

--no-stream point in shot

docker container stats - all containers are listed

docker container top <container_name> list of all processes in the container
