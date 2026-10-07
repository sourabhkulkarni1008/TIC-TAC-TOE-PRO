$port = 8000
$root = "c:\Users\kulka\OneDrive\Desktop\TIC TAC TOE"
$ip = [System.Net.IPAddress]::Loopback
$listener = New-Object System.Net.Sockets.TcpListener($ip, $port)
$listener.Start()
Write-Host "Server started on http://localhost:$port/"

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }
        
        $tokens = $requestLine.Split(" ")
        if ($tokens.Length -ge 2) {
            $rawPath = $tokens[1].TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "") {
                $rawPath = "index.html"
            }
            # Remove query string if any
            if ($rawPath.Contains("?")) {
                $rawPath = $rawPath.Substring(0, $rawPath.IndexOf("?"))
            }
            
            $filePath = Join-Path $root $rawPath
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json" }
                    ".png"  { "image/png" }
                    ".svg"  { "image/svg+xml" }
                    default { "application/octet-stream" }
                }
                
                $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
                $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($bytes, 0, $bytes.Length)
            } else {
                $msg = "HTTP/1.1 404 Not Found`r`nContent-Length: 13`r`nConnection: close`r`n`r`n404 Not Found"
                $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
                $stream.Write($msgBytes, 0, $msgBytes.Length)
            }
        }
        $stream.Flush()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
