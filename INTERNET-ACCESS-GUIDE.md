# Internet Access Setup Guide

Access your billing system from anywhere in the world using Cloudflare Tunnel.

## What is Cloudflare Tunnel?

Cloudflare Tunnel creates a secure connection from your computer to Cloudflare's network, allowing you to access your local app from anywhere without:
- Opening ports on your router
- Getting a static IP address
- Configuring firewalls
- Setting up SSL certificates

**It's FREE** and provides automatic HTTPS encryption!

---

## Step 1: Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Click "Sign Up"
3. Create a free account

---

## Step 2: Add Your Domain (Optional but Recommended)

If you have a domain name (like `mycompany.com`):

1. Login to Cloudflare Dashboard
2. Click "Add a Website"
3. Enter your domain name
4. Follow the setup wizard to update your domain's nameservers

**No domain?** You can still use Cloudflare Tunnel with a free `.trycloudflare.com` subdomain.

---

## Step 3: Install Cloudflared on Windows

### Option A: Download Installer (Easiest)

1. Go to: https://github.com/cloudflare/cloudflared/releases/latest
2. Download: `cloudflared-windows-amd64.msi`
3. Run the installer
4. Restart Command Prompt

### Option B: Using Winget

Open PowerShell and run:
```
winget install cloudflare.cloudflared
```

### Verify Installation

Open Command Prompt and run:
```
cloudflared --version
```
You should see a version number.

---

## Step 4: Run Internet Setup

1. Double-click `internet-setup.bat`
2. Follow the prompts
3. When asked, login to your Cloudflare account in the browser
4. Enter your domain name when prompted

---

## Step 5: Start Your App with Internet Access

### Start the App:
```
PRODUCTION-START.bat
```

### Start the Tunnel (in a separate window):
```
start-tunnel.bat
```

### Access from Anywhere:
Open your browser and go to:
```
https://your-domain.com
```

---

## Making It Automatic

### Install as Windows Service (Recommended)

Run Command Prompt **as Administrator** and execute:
```
cloudflared service install
```

This will:
- Start the tunnel automatically when Windows starts
- Keep it running in the background
- Restart if it crashes

### Uninstall Service

```
cloudflared service uninstall
```

---

## Troubleshooting

### "cloudflared not found"
- Restart Command Prompt after installing
- Check if cloudflared is in your PATH

### "Tunnel not found"
- Run `cloudflared tunnel list` to see available tunnels
- Re-run `internet-setup.bat` to create a new tunnel

### "Cannot connect to localhost:5000"
- Make sure your app is running (check `pm2 list`)
- Start the app with `PRODUCTION-START.bat`

### "DNS error"
- Make sure your domain is added to Cloudflare
- Wait 5-10 minutes for DNS to propagate

### Check Tunnel Status
```
cloudflared tunnel info billing-system
```

### View Tunnel Logs
```
cloudflared tunnel run billing-system --loglevel debug
```

---

## Security Notes

1. **HTTPS is automatic** - Cloudflare provides free SSL certificates
2. **Your app has login protection** - Users must authenticate
3. **Company expiry is enforced** - Expired companies cannot access
4. **No ports exposed** - Your router/firewall stays closed

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start app | `PRODUCTION-START.bat` |
| Start tunnel | `start-tunnel.bat` |
| Check app status | `pm2 list` |
| Check tunnel status | `cloudflared tunnel list` |
| View app logs | `pm2 logs billing_system` |
| Stop app | `pm2 stop billing_system` |
| Restart app | `pm2 restart billing_system` |

---

## Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- Cloudflare Support: https://support.cloudflare.com
