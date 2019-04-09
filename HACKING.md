# HACKING

Want to develop on this project ? There's some tricks.

## Spy on the snapd socket

You can listen what is going on the snapd UNIX socket by replacing the original socket by a new one while the daemon is running and forwarding received frames to the original one.
Here are the commands to do so (to run as root) :

```bash
mv /run/snapd.socket /run/snapd.socket.original
socat -t100 -v unix-listen:/run/snapd.socket,mode=777,reuseaddr,fork unix-connect:/run/snapd.socket.original
```