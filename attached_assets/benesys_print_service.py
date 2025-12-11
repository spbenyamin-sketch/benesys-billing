#!/usr/bin/env python3
"""
BeneSys Direct Print Service for Windows

This service connects to your BeneSys application and receives print
commands via WebSocket, then sends them directly to your local printer.

Requirements:
- Python 3.8+
- Windows OS
- Install dependencies: pip install websocket-client pywin32

Usage:
1. Install Python 3.8 or higher from python.org
2. Open Command Prompt and run: pip install websocket-client pywin32
3. Edit the SERVER_URL below to match your Replit URL
4. Run: python benesys_print_service.py

The service will connect to your BeneSys app and automatically print
invoices to your default Windows printer.
"""

import json
import time
import sys
import threading
from datetime import datetime
import ssl

# Configuration - EDIT THESE VALUES
SERVER_URL = "wss://YOUR-REPLIT-URL.replit.dev/ws/print"  # Change this to your Replit URL! Example: wss://myapp-abc123.replit.dev/ws/print
PRINT_TOKEN = "YOUR-TOKEN-HERE"  # Generate this token in Bill Settings > Quick Print tab
RECONNECT_DELAY = 5  # Seconds between reconnection attempts

# Try to import required libraries
try:
    import websocket
except ImportError:
    print("Error: websocket-client not installed")
    print("Run: pip install websocket-client")
    sys.exit(1)

# Windows printing support
try:
    import win32print
    import win32ui
    import win32con
    from PIL import Image, ImageDraw, ImageFont
    PRINT_AVAILABLE = True
except ImportError:
    print("Warning: pywin32 or Pillow not installed - using console output mode")
    print("For actual printing, install: pip install pywin32 Pillow")
    PRINT_AVAILABLE = False


class PrintService:
    def __init__(self, server_url, print_token):
        self.server_url = server_url
        self.print_token = print_token
        self.ws = None
        self.running = True
        self.connected = False
        
    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def print_text(self, text, printer_name=None):
        """Print plain text to the specified or default printer"""
        if not PRINT_AVAILABLE:
            self.log("=== PRINT OUTPUT (Console Mode) ===")
            print(text)
            self.log("=== END PRINT OUTPUT ===")
            return True
            
        try:
            # Get printer
            if printer_name:
                hprinter = win32print.OpenPrinter(printer_name)
            else:
                printer_name = win32print.GetDefaultPrinter()
                hprinter = win32print.OpenPrinter(printer_name)
            
            self.log(f"Printing to: {printer_name}")
            
            try:
                # Start document
                job = win32print.StartDocPrinter(hprinter, 1, ("BeneSys Invoice", None, "RAW"))
                win32print.StartPagePrinter(hprinter)
                
                # Send text data
                win32print.WritePrinter(hprinter, text.encode('utf-8'))
                
                # End document
                win32print.EndPagePrinter(hprinter)
                win32print.EndDocPrinter(hprinter)
                
                self.log("Print job sent successfully")
                return True
            finally:
                win32print.ClosePrinter(hprinter)
                
        except Exception as e:
            self.log(f"Print error: {e}")
            return False
            
    def print_html(self, html_content, printer_name=None):
        """Print HTML content - converts to text for thermal printers"""
        if not PRINT_AVAILABLE:
            self.log("=== HTML PRINT OUTPUT (Console Mode) ===")
            # Strip HTML tags for console display
            import re
            text = re.sub(r'<[^>]+>', '', html_content)
            text = re.sub(r'\s+', ' ', text)
            print(text[:500] + "..." if len(text) > 500 else text)
            self.log("=== END HTML PRINT OUTPUT ===")
            return True
            
        try:
            # Get printer
            if printer_name:
                hprinter = win32print.OpenPrinter(printer_name)
            else:
                printer_name = win32print.GetDefaultPrinter()
                hprinter = win32print.OpenPrinter(printer_name)
                
            self.log(f"Printing HTML to: {printer_name}")
            
            # For thermal printers, we need to convert HTML to ESC/POS or plain text
            # This is a simplified version - you may need to customize for your printer
            
            import re
            # Strip HTML and normalize whitespace
            text = re.sub(r'<br\s*/?>', '\n', html_content)
            text = re.sub(r'<div[^>]*>', '', text)
            text = re.sub(r'</div>', '\n', text)
            text = re.sub(r'<span[^>]*>', '', text)
            text = re.sub(r'</span>', '', text)
            text = re.sub(r'<[^>]+>', '', text)
            text = re.sub(r'&nbsp;', ' ', text)
            text = re.sub(r'&amp;', '&', text)
            text = re.sub(r'&#8377;|₹', 'Rs.', text)
            text = re.sub(r'\n\s*\n', '\n', text)
            
            try:
                # Use GDI printing for better quality
                hdc = win32ui.CreateDC()
                hdc.CreatePrinterDC(printer_name)
                
                hdc.StartDoc("BeneSys Invoice")
                hdc.StartPage()
                
                # Get printable area
                printable_width = hdc.GetDeviceCaps(win32con.HORZRES)
                printable_height = hdc.GetDeviceCaps(win32con.VERTRES)
                
                # Set font
                font = win32ui.CreateFont({
                    "name": "Courier New",
                    "height": 24,
                    "weight": 400,
                })
                hdc.SelectObject(font)
                
                # Print text line by line
                y = 50
                line_height = 28
                for line in text.split('\n'):
                    line = line.strip()
                    if line:
                        hdc.TextOut(50, y, line)
                        y += line_height
                        if y > printable_height - 100:
                            hdc.EndPage()
                            hdc.StartPage()
                            y = 50
                
                hdc.EndPage()
                hdc.EndDoc()
                
                self.log("HTML print job sent successfully")
                return True
                
            finally:
                win32print.ClosePrinter(hprinter)
                
        except Exception as e:
            self.log(f"HTML print error: {e}")
            return False
            
    def on_message(self, ws, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "connected":
                self.log(f"Connected to server: {data.get('message')}")
                self.connected = True
                
            elif msg_type == "pong":
                pass  # Heartbeat response
                
            elif msg_type == "print":
                self.log("Received print command")
                content = data.get("content", "")
                format_type = data.get("format", "text")
                printer_name = data.get("printerName")
                
                if format_type == "html":
                    success = self.print_html(content, printer_name)
                else:
                    success = self.print_text(content, printer_name)
                    
                # Send result back
                ws.send(json.dumps({
                    "type": "print_result",
                    "success": success,
                    "timestamp": data.get("timestamp")
                }))
                
            else:
                self.log(f"Unknown message type: {msg_type}")
                
        except json.JSONDecodeError as e:
            self.log(f"Invalid JSON message: {e}")
        except Exception as e:
            self.log(f"Error handling message: {e}")
            
    def on_error(self, ws, error):
        """Handle WebSocket errors"""
        self.log(f"WebSocket error: {error}")
        self.connected = False
        
    def on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket connection close"""
        self.log(f"Connection closed: {close_status_code} - {close_msg}")
        self.connected = False
        
    def on_open(self, ws):
        """Handle WebSocket connection open"""
        self.log("WebSocket connection opened")
        
        # Start heartbeat thread
        def heartbeat():
            while self.running and self.connected:
                try:
                    ws.send(json.dumps({"type": "ping"}))
                except:
                    break
                time.sleep(30)
                
        threading.Thread(target=heartbeat, daemon=True).start()
        
    def connect(self):
        """Connect to the WebSocket server"""
        url = f"{self.server_url}?token={self.print_token}"
        self.log(f"Connecting to: {url}")
        
        # Create SSL context that doesn't verify certificates (for self-signed Replit certs)
        try:
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
        except:
            ssl_context = None
        
        self.ws = websocket.WebSocketApp(
            url,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open,
            header={"User-Agent": "BeneSys-PrintService/1.0"}
        )
        
        # Run with proper SSL options
        try:
            if ssl_context:
                self.ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE, "ssl_version": ssl.PROTOCOL_TLS})
            else:
                self.ws.run_forever()
        except Exception as e:
            # Fallback: try without SSL options
            self.log(f"SSL connection attempt failed, retrying: {e}")
            self.ws.run_forever()
        
    def run(self):
        """Main run loop with auto-reconnect"""
        self.log("BeneSys Print Service starting...")
        self.log(f"Server URL: {self.server_url}")
        
        if PRINT_AVAILABLE:
            self.log(f"Default printer: {win32print.GetDefaultPrinter()}")
            self.log("Available printers:")
            for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL):
                self.log(f"  - {printer[2]}")
        else:
            self.log("Running in console mode (no actual printing)")
            
        self.log("")
        self.log("Press Ctrl+C to stop the service")
        self.log("")
        
        while self.running:
            try:
                self.connect()
            except KeyboardInterrupt:
                self.log("Shutting down...")
                self.running = False
                break
            except Exception as e:
                self.log(f"Connection error: {e}")
                
            if self.running:
                self.log(f"Reconnecting in {RECONNECT_DELAY} seconds...")
                time.sleep(RECONNECT_DELAY)


def main():
    print("=" * 50)
    print("  BeneSys Direct Print Service for Windows")
    print("=" * 50)
    print()
    
    # Check if URL has been configured
    if "YOUR-REPLIT-URL" in SERVER_URL:
        print("ERROR: Please edit this file and set your SERVER_URL!")
        print()
        print("Find this line near the top of the file:")
        print('  SERVER_URL = "wss://YOUR-REPLIT-URL.replit.app/ws/print"')
        print()
        print("Change it to your actual Replit URL, for example:")
        print('  SERVER_URL = "wss://benesys.username.replit.app/ws/print"')
        print()
        input("Press Enter to exit...")
        sys.exit(1)
        
    # Check if token has been configured
    if "YOUR-TOKEN-HERE" in PRINT_TOKEN or not PRINT_TOKEN:
        print("ERROR: Please edit this file and set your PRINT_TOKEN!")
        print()
        print("To get your token:")
        print("1. Open your BeneSys app in the browser")
        print("2. Go to Settings > Bill Settings")
        print("3. Click the 'Quick Print' tab")
        print("4. Enable 'Direct Print Service'")
        print("5. Click 'Generate New Token' and copy the token")
        print("6. Paste the token in this file:")
        print('   PRINT_TOKEN = "your-token-here"')
        print()
        input("Press Enter to exit...")
        sys.exit(1)
        
    service = PrintService(SERVER_URL, PRINT_TOKEN)
    
    try:
        service.run()
    except KeyboardInterrupt:
        print("\nService stopped by user")
        
        
if __name__ == "__main__":
    main()
