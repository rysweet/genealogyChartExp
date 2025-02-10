#!/usr/bin/env bash

# Output file
output_file="setup_project_generated.sh"

# Start with shebang and initial setup
cat << 'EOF' > "$output_file"
#!/usr/bin/env bash

# Exit on error
set -e

# Create project structure
mkdir -p my-genealogy-app
cd my-genealogy-app

EOF

# Function to create directories
function generate_mkdir_commands() {
    find . -type d -not -path "*/\.*" -not -path "./node_modules*" -not -path "./build*" | 
    while read -r dir; do
        if [ "$dir" != "." ]; then
            echo "mkdir -p \"${dir#./}\"" >> "$output_file"
        fi
    done
}

# Function to add file content
function add_file_content() {
    local filepath="$1"
    local relpath="${filepath#./}"
    
    # Skip node_modules, build directories, and hidden files
    if [[ "$relpath" == *"node_modules/"* ]] || 
       [[ "$relpath" == *"build/"* ]] || 
       [[ "$relpath" == ".*" ]] || 
       [[ "$relpath" == *".git/"* ]]; then
        return
    fi

    echo -e "\n# Create $relpath" >> "$output_file"
    echo "cat << 'EOF' > \"$relpath\"" >> "$output_file"
    cat "$filepath" >> "$output_file"
    echo "EOF" >> "$output_file"
}

# Generate directory structure
echo "# Create directory structure" >> "$output_file"
generate_mkdir_commands

# Add all files
find . -type f -not -path "*/\.*" -not -path "./node_modules*" -not -path "./build*" |
while read -r file; do
    add_file_content "$file"
done

# Add final setup commands
cat << 'EOF' >> "$output_file"

# Initialize git repository
git init

# Install dependencies
echo "Installing dependencies..."
npm install

# Final message
echo "-------------------------------------------------"
echo "Setup complete! To start the app:"
echo "1. cd my-genealogy-app"
echo "2. npm start"
echo "Then open http://localhost:3000 in your browser"
echo "-------------------------------------------------"
EOF

# Make the generated script executable
chmod +x "$output_file"

echo "Setup script generated as $output_file"
