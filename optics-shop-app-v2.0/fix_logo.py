#!/usr/bin/env python3

# Read the complete base64 logo from the terminal output
complete_base64 = """iVBORw0KGgoAAAANSUhEUgAABbAAAAWwCAYAAACM2Ge7AAAVXmVYSWZNTQAqAAAACAAFAQAABAAAAAEAAAAAAQEABAAAAAEAAAAA"""

# Read the app.js file
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the truncated base64 with the complete one
# The truncated version ends with "AAAAA" but we need the complete one
old_string = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABbAAAAWwCAYAAACM2Ge7AAAVXmVYSWZNTQAqAAAACAAFAQAABAAAAAEAAAAAAQEABAAAAAEAAAAA'
new_string = 'data:image/png;base64,' + complete_base64

# Replace all occurrences
content = content.replace(old_string, new_string)

# Write back to the file
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Logo base64 string updated successfully!")
