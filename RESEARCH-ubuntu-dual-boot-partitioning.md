# Which partitions do I need for an Ubuntu dual-boot alongside Windows, and what type/size should they be?

**Answer:** On a modern UEFI/GPT machine you need only **two new partitions**: an ext4 `/` (root, 50–60 GB minimum comfortable, 100 GB if you'll install heavy toolchains/games) and optionally an ext4 `/home` taking the rest of the freed space. Reuse the existing Windows EFI System Partition (FAT32, ~100 MB) mounted at `/boot/efi` — do not format it and do not create a second ESP. No swap partition is needed: Ubuntu creates a swap file automatically; only add a swap partition (≥ RAM size) if you plan to hibernate Linux. Easiest path: shrink C: in Windows Disk Management, then pick "Install Ubuntu alongside Windows Boot Manager."

**Confidence:** high — the layout is confirmed by Ubuntu's official docs and multiple independent current guides; the only real variable is how much space to allocate.

**Assumptions:** desktop with a single drive, Windows already installed, UEFI + GPT (standard on anything from the last decade). If `msinfo32` shows "BIOS Mode: Legacy", the advice changes (MBR disk, no ESP).

## Why — reasoning, evidence attached to each step

1. **Firmware model decides the partition list.** With UEFI + GPT, boot files live on an EFI System Partition (ESP, FAT32, flagged boot). Windows already created one (~100 MB is fine, it stays nearly empty) — the Ubuntu installer mounts it at `/boot/efi`; creating a second ESP on the same disk is unnecessary and can confuse boot entries. [1][3][5][6]
2. **Root `/` sizing.** Official minimums are small (8–25 GB) but real-world guidance converges on 20–30 GB as the floor and 40–100 GB as comfortable for a desktop you'll actually use. Root holds the OS, installed packages, snap/flatpak apps, and Docker images if you use them — all of which grow. [3][5][6]
3. **Separate `/home` is optional, not required.** Benefit: clean reinstalls and distro-hopping without losing user data. Cost: fixed split between system and data. If unsure, skip it and let `/` take everything — you can also put `/home` on the root partition and keep large data on an NTFS partition both OSes can read. [3][5][6]
4. **Swap partition is obsolete for most users.** Current Ubuntu installs default to a swap *file* on `/`. A dedicated swap partition sized ≥ RAM only matters if you want hibernation (suspend-to-disk) under Linux — and hibernation in dual-boot is a known source of NTFS corruption risk anyway. [5][6][8]
5. **Windows-side blockers, in order of damage potential:** BitLocker makes the disk look like random noise to the installer — disable/decrypt it first (`manage-bde -off C:`), and back up the recovery key [2][6][7][9]; Fast Startup leaves NTFS half-hibernated so Linux can't mount it safely — uncheck "Turn on fast startup" in Power Options [6][7]; Intel RST/RAID SATA mode makes the installer not see the disk at all — switch to AHCI in firmware first, boot Windows once to confirm it still starts [6][8]. Secure Boot can stay ON — Ubuntu ships a signed shim bootloader. [6][8]
6. **Shrink C: inside Windows, not from the installer.** Disk Management → right-click C: → Shrink Volume → enter MB (100 GB = 102400). If it won't shrink far enough, the blocker is usually immovable files (pagefile, hiberfil, restore points) — run `cleanmgr`, or temporarily disable pagefile/hibernation. [6][7][9]
7. **After install:** GRUB becomes the boot menu and chain-loads Windows. Fix the dual-boot clock drift (Windows keeps RTC in local time, Linux in UTC) with one registry change in Windows: `reg add "HKLM\System\CurrentControlSet\Control\TimeZoneInformation" /v RealTimeIsUniversal /d 1 /t REG_DWORD /f`. If Secure Boot rejects the NVIDIA driver, enroll a MOK once via `sudo mokutil --import /var/lib/shim-signed/mok/MOK.der`. [6]

### The partition table

| # | Partition | Type | Size | Notes |
|---|-----------|------|------|-------|
| existing | ESP | FAT32 | ~100 MB (as-is) | Reuse. Mount `/boot/efi`. **Do not format.** |
| new | `/` root | ext4 | 50–60 GB (100 GB for heavy use) | Required. |
| new | `/home` | ext4 | remainder | Optional but recommended. |
| — | swap | — | 0 | Swap file is created automatically. Partition ≥ RAM only for hibernation. |

## What would change this

- **Legacy BIOS / MBR disk** (check `msinfo32` → BIOS Mode): no ESP exists; you'd need a 1 MB BIOS-boot partition instead, and primary-partition limits apply.
- **Second physical drive available**: simplest of all — tell the installer to erase *that* disk; zero repartitioning risk to Windows.
- **BitLocker you must keep**: decrypt → install → re-encrypt works on Pro editions, but some Windows versions won't let you re-enable it (verify before committing). [2]
- **Hibernation needed on Linux**: requires a swap partition ≥ RAM and extra setup — changes the layout.

## Considered and rejected

- **Separate `/boot` partition** — needed only for full-disk-encryption or exotic layouts; adds a failure point (fills up with old kernels). [3][4]
- **Manual swap partition sized 2×RAM** — stale advice from the MBR-era wiki; swap file is the modern default and resizable. [4][5]
- **"Install alongside" without shrinking first** — works, but the installer's slider gives you less control than pre-allocating space in Windows, and it can't proceed at all with BitLocker on. [1][2]
- **Letting Windows tools create the Linux partitions** — create only unallocated space in Windows; make the ext4 partitions inside the Ubuntu installer. [4]

## Open

- Your actual disk size and RAM — the 50/100 GB root recommendation assumes a ≥500 GB drive; on a 256 GB SSD the split math changes.
- Whether hibernation on the Linux side matters to you (would reintroduce a swap partition).

## Sources

[1] Install Ubuntu Desktop — official tutorial: https://ubuntu.com/desktop/docs/en/latest/tutorial/install-ubuntu-desktop/
[2] BitLocker during Ubuntu installation — official: https://ubuntu.com/desktop/docs/en/latest/reference/bitlocker-during-ubuntu-installation/
[3] DiskSpace — Ubuntu Community Help Wiki: https://help.ubuntu.com/community/DiskSpace
[4] WindowsDualBoot — Ubuntu Community Help Wiki: https://help.ubuntu.com/community/WindowsDualBoot
[5] Ubuntu 24.04 LTS Install Guide: Dual-Boot, Secure Boot, Zero Data Loss — cr0x.net: https://cr0x.net/en/ubuntu-24-04-safe-dual-boot/
[6] Dual Boot Guide: Windows 11 and Ubuntu — merox.dev: https://merox.dev/blog/windows-11-ubuntu-25-04-dual-boot-guide/
[7] Dual Booting Windows 11 and Ubuntu — linuxvox.com: https://linuxvox.com/blog/how-to-dual-boot-windows-11-and-ubuntu/
[8] Dual Boot Windows and Ubuntu with Secure Boot and FDE — wiki.ethanppl.com: https://wiki.ethanppl.com/blog/2024/02/29/dual-boot-guide
[9] Dual-booting Linux on a Windows Machine with BitLocker — Olin College IT: https://helpdesk.olin.edu/TDClient/314/Portal/KB/PrintArticle?ID=10867
