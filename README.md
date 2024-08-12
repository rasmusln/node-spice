# node spice

> **This is a WIP / partial implementation and currently covers the main and inputs channel with most of the related messages implemented. Encryption is not implemented**

## Introduction

A nodejs implementation of the spice protocol.

## Examples

### Preparation

Install the dependencies

```bash
npm install
```

and then start a spice server.

As an example `qemu` can be used to start both a vnc server and spice server for the same virtual machine

```sh
qemu-system-x86_64 -smp 2 -m 2048 -boot d -cdrom ~/path/to/some.iso -vnc :0 -vga qxl \
  -device virtio-serial-pci -spice port=5930,disable-ticketing=on \
  -device virtserialport,chardev=spicechannel0,name=com.redhat.spice.0 \
  -chardev spicevmc,id=spicechannel0,name=vdagent
```

### Run examples

The vscode launch configurations are declared in `.vscode/launch.json` for the examples and can be easily run and debugged using standard vscode comamnds. For other editors/IDEs consult the `.vscode/launch.json`.
