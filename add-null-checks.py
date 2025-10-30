#!/usr/bin/env python3
import re
import os

FILES = [
    "app/api/admin-test/route.ts",
    "app/api/auth/logout/route.ts",
    "app/api/auth/mfa/setup/route.ts",
    "app/api/buyers/[id]/route.ts",
    "app/api/buyers/route.ts",
    "app/api/dashboard/summary/route.ts",
    "app/api/employees/[id]/route.ts",
    "app/api/kas-besar/route.ts",
    "app/api/kas-besar/stats/route.ts",
    "app/api/payroll/route.ts",
    "app/api/payroll/save/route.ts",
]

NULL_CHECK_CODE = """  try {
    // Check if prisma client is available
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }
"""

def add_null_check_to_function(content, func_line_start):
    """Add null check after function declaration and before try block"""
    lines = content.split('\n')

    # Find the try block after the function declaration
    i = func_line_start
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped.startswith('try {'):
            # Insert null check right after 'try {'
            indent = len(lines[i]) - len(lines[i].lstrip())
            check_lines = NULL_CHECK_CODE.split('\n')
            # Remove the first 'try {' from NULL_CHECK_CODE since it already exists
            check_lines = check_lines[1:]

            # Add proper indentation
            indented_checks = []
            for line in check_lines:
                if line.strip():
                    indented_checks.append(' ' * indent + line.lstrip())
                else:
                    indented_checks.append('')

            # Insert after the try line
            lines.insert(i + 1, '\n'.join(indented_checks))
            return '\n'.join(lines)
        i += 1

    return content

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r') as f:
        content = f.read()

    # Check if file already has null checks
    if '// Check if prisma client is available' in content:
        print(f"Skipping {filepath} - already has null checks")
        return

    # Find all export async function lines
    pattern = r'^export async function (GET|POST|PUT|DELETE|PATCH)\('
    lines = content.split('\n')

    modified = False
    for i, line in enumerate(lines):
        if re.match(pattern, line):
            func_name = re.search(pattern, line).group(1)
            print(f"  Found {func_name} at line {i+1}")

            # Add null check to this function
            content = add_null_check_to_function(content, i)
            modified = True
            break  # Process one function at a time to avoid index issues

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✓ Added null check to {filepath}")
    else:
        print(f"○ No changes needed for {filepath}")

def main():
    print("Adding null checks to all API routes...\n")
    for filepath in FILES:
        print(f"Processing {filepath}...")
        # Process multiple times to catch all functions
        for _ in range(5):  # Max 5 functions per file
            process_file(filepath)
    print("\n✓ All files processed!")

if __name__ == "__main__":
    main()
