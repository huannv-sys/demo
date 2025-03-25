#!/usr/bin/env python3

import os
import sys
import json
import subprocess
import re
from collections import defaultdict, Counter
import argparse

class RepoAnalyzer:
    def __init__(self, repo_path):
        self.repo_path = repo_path
        self.file_extensions = Counter()
        self.file_count = 0
        self.dir_count = 0
        self.languages = set()
        self.frameworks = set()
        self.file_tree = {}
        self.readme_content = ""
        self.dependencies = {}
        
    def analyze(self):
        print(f"Analyzing repository at: {self.repo_path}")
        
        # Check if path exists
        if not os.path.exists(self.repo_path):
            print(f"Error: Path does not exist: {self.repo_path}")
            return False
            
        # Check if it's a git repository
        if not os.path.exists(os.path.join(self.repo_path, '.git')):
            print(f"Warning: {self.repo_path} does not appear to be a git repository. Limited analysis will be performed.")
        
        self._analyze_file_structure()
        self._detect_languages_and_frameworks()
        self._extract_readme()
        self._analyze_dependencies()
        self._analyze_mikrotik_integration()
        
        return True
    
    def _analyze_file_structure(self):
        print("Analyzing file structure...")
        
        for root, dirs, files in os.walk(self.repo_path):
            # Skip .git directory
            if '.git' in dirs:
                dirs.remove('.git')
                
            # Count directories
            self.dir_count += len(dirs)
            
            # Process files in this directory
            for file in files:
                self.file_count += 1
                _, ext = os.path.splitext(file)
                if ext:
                    # Remove the dot from the extension
                    self.file_extensions[ext[1:]] += 1
                    
                # Add to file tree
                rel_path = os.path.relpath(os.path.join(root, file), self.repo_path)
                self._add_to_file_tree(rel_path)
    
    def _add_to_file_tree(self, path):
        parts = path.split(os.sep)
        current = self.file_tree
        
        for i, part in enumerate(parts):
            if i == len(parts) - 1:  # Last part (file)
                if '__files__' not in current:
                    current['__files__'] = []
                current['__files__'].append(part)
            else:  # Directory
                if part not in current:
                    current[part] = {}
                current = current[part]
    
    def _detect_languages_and_frameworks(self):
        print("Detecting languages and frameworks...")
        
        # Language detection based on file extensions
        lang_mapping = {
            'js': 'JavaScript',
            'ts': 'TypeScript',
            'jsx': 'JavaScript (React)',
            'tsx': 'TypeScript (React)',
            'py': 'Python',
            'php': 'PHP',
            'rb': 'Ruby',
            'java': 'Java',
            'go': 'Go',
            'c': 'C',
            'cpp': 'C++',
            'cs': 'C#',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'less': 'LESS',
            'md': 'Markdown',
            'json': 'JSON',
            'xml': 'XML',
            'yaml': 'YAML',
            'yml': 'YAML',
            'sql': 'SQL'
        }
        
        for ext, count in self.file_extensions.items():
            if ext in lang_mapping:
                self.languages.add(lang_mapping[ext])
        
        # Framework detection based on files and dependencies
        framework_indicators = {
            'react': ('react', 'JavaScript (React)', 'react-dom', 'jsx'),
            'vue': ('vue', 'vue.js', 'vuex', 'vue-router'),
            'angular': ('angular', '@angular', 'ng'),
            'express': ('express', 'express.js'),
            'django': ('django', 'settings.py', 'urls.py', 'wsgi.py'),
            'flask': ('flask', 'Flask', 'flask.py'),
            'laravel': ('laravel', 'artisan', 'Laravel'),
            'symfony': ('symfony', 'Symfony'),
            'spring': ('spring', 'Spring', 'SpringBootApplication'),
            'rails': ('rails', 'Ruby on Rails', 'config/routes.rb'),
            'bootstrap': ('bootstrap', 'Bootstrap'),
            'jquery': ('jquery', 'jQuery'),
        }
        
        # Check for framework files
        for root, _, files in os.walk(self.repo_path):
            for file in files:
                file_content = ""
                file_path = os.path.join(root, file)
                
                # Try to read the file content for text files
                try:
                    if os.path.getsize(file_path) < 1000000:  # Skip large files
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            file_content = f.read().lower()
                except:
                    continue
                
                # Check for framework indicators in file content
                for framework, indicators in framework_indicators.items():
                    for indicator in indicators:
                        if indicator.lower() in file_content or indicator.lower() in file.lower():
                            self.frameworks.add(framework.capitalize())
    
    def _extract_readme(self):
        print("Extracting README content...")
        
        readme_paths = [
            os.path.join(self.repo_path, 'README.md'),
            os.path.join(self.repo_path, 'README.txt'),
            os.path.join(self.repo_path, 'readme.md'),
            os.path.join(self.repo_path, 'Readme.md')
        ]
        
        for path in readme_paths:
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        self.readme_content = f.read()
                    break
                except:
                    pass
    
    def _analyze_dependencies(self):
        print("Analyzing dependencies...")
        
        # Check for package.json (Node.js)
        package_json_path = os.path.join(self.repo_path, 'package.json')
        if os.path.exists(package_json_path):
            try:
                with open(package_json_path, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                    self.dependencies['node'] = {
                        'dependencies': package_data.get('dependencies', {}),
                        'devDependencies': package_data.get('devDependencies', {})
                    }
            except:
                print("Error parsing package.json")
        
        # Check for requirements.txt (Python)
        requirements_path = os.path.join(self.repo_path, 'requirements.txt')
        if os.path.exists(requirements_path):
            try:
                with open(requirements_path, 'r', encoding='utf-8') as f:
                    requirements = f.read().splitlines()
                    self.dependencies['python'] = {
                        'requirements': [r.strip() for r in requirements if r.strip() and not r.startswith('#')]
                    }
            except:
                print("Error parsing requirements.txt")
        
        # Check for composer.json (PHP)
        composer_json_path = os.path.join(self.repo_path, 'composer.json')
        if os.path.exists(composer_json_path):
            try:
                with open(composer_json_path, 'r', encoding='utf-8') as f:
                    composer_data = json.load(f)
                    self.dependencies['php'] = {
                        'require': composer_data.get('require', {}),
                        'require-dev': composer_data.get('require-dev', {})
                    }
            except:
                print("Error parsing composer.json")
    
    def _analyze_mikrotik_integration(self):
        print("Analyzing Mikrotik API integration...")
        
        mikrotik_indicators = [
            'routeros', 'mikrotik', 'rosapi', 'api_mikrotik', 'mikrotik_api', 
            'routeros_api', 'routerosapi', 'ros_api'
        ]
        
        mikrotik_files = []
        mikrotik_api_usage = []
        
        # Search for Mikrotik API usage in files
        for root, _, files in os.walk(self.repo_path):
            for file in files:
                # Skip binary files and very large files
                file_path = os.path.join(root, file)
                if self._is_binary_file(file_path) or os.path.getsize(file_path) > 1000000:
                    continue
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().lower()
                        
                    # Check for Mikrotik indicators
                    for indicator in mikrotik_indicators:
                        if indicator in content:
                            rel_path = os.path.relpath(file_path, self.repo_path)
                            mikrotik_files.append(rel_path)
                            
                            # Extract API usage examples
                            api_usage_patterns = [
                                r"(?:connect|login).*?(?:routeros|mikrotik)",
                                r"(?:api|routeros)\.(?:command|query|send|write)",
                                r"(?:routeros|mikrotik).*?(?:api|request)",
                                r"new.*?(?:RouterOS|Mikrotik|ROS).*?(?:API|Client)"
                            ]
                            
                            for pattern in api_usage_patterns:
                                matches = re.findall(pattern, content, re.IGNORECASE)
                                for match in matches:
                                    # Get surrounding context
                                    start_pos = max(0, content.find(match) - 100)
                                    end_pos = min(len(content), content.find(match) + len(match) + 100)
                                    context = content[start_pos:end_pos]
                                    mikrotik_api_usage.append({
                                        'file': rel_path,
                                        'usage': context
                                    })
                            
                            break
                except:
                    pass
        
        self.mikrotik_integration = {
            'files': list(set(mikrotik_files)),
            'api_usage': mikrotik_api_usage[:10]  # Limit to 10 examples
        }
    
    def _is_binary_file(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                f.read(1024)
                return False
        except:
            return True
    
    def generate_report(self):
        report = {
            'repository_path': self.repo_path,
            'file_stats': {
                'total_files': self.file_count,
                'total_directories': self.dir_count,
                'file_extensions': dict(self.file_extensions.most_common(20))
            },
            'languages': list(self.languages),
            'frameworks': list(self.frameworks),
            'dependencies': self.dependencies,
            'mikrotik_integration': getattr(self, 'mikrotik_integration', {'files': [], 'api_usage': []}),
            'readme_summary': self._summarize_readme()
        }
        
        return report
    
    def _summarize_readme(self):
        if not self.readme_content:
            return "No README found"
        
        # Get the first few lines as summary
        lines = self.readme_content.splitlines()
        title = next((line for line in lines if line.strip()), "No title")
        
        # Try to find installation/setup instructions
        installation_section = ""
        in_installation_section = False
        
        for i, line in enumerate(lines):
            lower_line = line.lower()
            if re.match(r'^#+\s*(install|setup|getting started|configuration)', lower_line):
                in_installation_section = True
                installation_section = line + "\n"
            elif in_installation_section:
                if i < len(lines) - 1 and re.match(r'^#+\s', lines[i+1]):
                    # Next line is a header, end of section
                    installation_section += line + "\n"
                    break
                else:
                    installation_section += line + "\n"
        
        return {
            'title': title,
            'length': len(lines),
            'installation_section': installation_section.strip() if installation_section else "No installation instructions found"
        }
    
    def print_report(self, report):
        print("\n" + "="*80)
        print(f"REPOSITORY ANALYSIS REPORT: {report['repository_path']}")
        print("="*80)
        
        print("\nFILE STATISTICS:")
        print(f"  Total Files: {report['file_stats']['total_files']}")
        print(f"  Total Directories: {report['file_stats']['total_directories']}")
        print("  File Extensions:")
        for ext, count in report['file_stats']['file_extensions'].items():
            print(f"    .{ext}: {count}")
        
        print("\nLANGUAGES DETECTED:")
        for lang in report['languages']:
            print(f"  - {lang}")
        
        print("\nFRAMEWORKS DETECTED:")
        if report['frameworks']:
            for framework in report['frameworks']:
                print(f"  - {framework}")
        else:
            print("  No frameworks detected")
        
        print("\nDEPENDENCIES:")
        if report['dependencies']:
            for lang, deps in report['dependencies'].items():
                print(f"  {lang.upper()} Dependencies:")
                for dep_type, deps_dict in deps.items():
                    print(f"    {dep_type}:")
                    if isinstance(deps_dict, dict):
                        for dep, version in list(deps_dict.items())[:10]:  # Show only first 10
                            print(f"      - {dep}: {version}")
                        if len(deps_dict) > 10:
                            print(f"      - ... {len(deps_dict) - 10} more")
                    elif isinstance(deps_dict, list):
                        for dep in deps_dict[:10]:  # Show only first 10
                            print(f"      - {dep}")
                        if len(deps_dict) > 10:
                            print(f"      - ... {len(deps_dict) - 10} more")
        else:
            print("  No dependencies found")
        
        print("\nMIKROTIK API INTEGRATION:")
        mikrotik_files = report['mikrotik_integration']['files']
        if mikrotik_files:
            print(f"  Found {len(mikrotik_files)} files with Mikrotik API references:")
            for file in mikrotik_files[:10]:  # Show top 10
                print(f"  - {file}")
            if len(mikrotik_files) > 10:
                print(f"  - ... {len(mikrotik_files) - 10} more")
            
            print("\n  API Usage Examples:")
            for example in report['mikrotik_integration']['api_usage'][:3]:  # Show top 3
                print(f"  - File: {example['file']}")
                print(f"    Usage: {example['usage'][:100]}...")
        else:
            print("  No explicit Mikrotik API integration found")
        
        print("\nREADME SUMMARY:")
        print(f"  Title: {report['readme_summary']['title']}")
        print(f"  Length: {report['readme_summary']['length']} lines")
        print("\n  Installation Instructions:")
        print(f"{report['readme_summary']['installation_section'][:500]}...")
        
        print("\n" + "="*80)
        print("RECOMMENDATIONS FOR EXTENDING THE PROJECT:")
        print("="*80)
        
        # Generate recommendations based on the analysis
        if not mikrotik_files:
            print("  - Investigate how the dashboard communicates with Mikrotik devices")
            print("  - Identify the API or protocol used for router communication")
        
        print("  - Review the existing features and identify gaps")
        print("  - Study the code structure to understand the architecture")
        print("  - Set up a test environment with a Mikrotik router for development")
        print("  - Consider adding automated tests if they don't exist")
        
        print("\n" + "="*80)

def main():
    parser = argparse.ArgumentParser(description='Analyze a Mikrotik-Dashboard repository')
    parser.add_argument('repo_path', nargs='?', default='.', help='Path to the repository (default: current directory)')
    parser.add_argument('--output', '-o', help='Output JSON report to a file')
    args = parser.parse_args()
    
    analyzer = RepoAnalyzer(args.repo_path)
    if analyzer.analyze():
        report = analyzer.generate_report()
        analyzer.print_report(report)
        
        if args.output:
            try:
                with open(args.output, 'w', encoding='utf-8') as f:
                    json.dump(report, f, indent=2)
                print(f"\nReport saved to {args.output}")
            except Exception as e:
                print(f"Error saving report: {e}")
    
if __name__ == "__main__":
    main()
