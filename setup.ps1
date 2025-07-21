# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $?) {
    Write-Host "Node.js is not installed. Please download and install Node.js from https://nodejs.org/"
    Write-Host "After installation, please run this script again."
    exit 1
}

# Check if npm is installed
$npmVersion = npm --version 2>$null
if (-not $?) {
    Write-Host "npm is not installed. Please install npm (it usually comes with Node.js)"
    exit 1
}

# Install project dependencies
Write-Host "Installing project dependencies..."
npm install

# Start the development server
Write-Host "Starting the development server..."
npm start 