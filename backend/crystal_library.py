import os
import json
from cif_parser import CIFParser

class CrystalLibrary:
    def __init__(self, cif_dir):
        self.cif_dir = cif_dir
        self.parser = CIFParser()
        self.index_file = os.path.join(cif_dir, 'index.json')
        self._load_index()
    
    def _load_index(self):
        if os.path.exists(self.index_file):
            with open(self.index_file, 'r', encoding='utf-8') as f:
                self.index = json.load(f)
        else:
            self.index = {}
            self.refresh()
    
    def refresh(self):
        self.index = {}
        for filename in os.listdir(self.cif_dir):
            if filename.endswith('.cif'):
                filepath = os.path.join(self.cif_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    data = self.parser.parse(content)
                    id = os.path.splitext(filename)[0]
                    self.index[id] = {
                        'id': id,
                        'name': data.get('name', id),
                        'formula': data.get('formula', ''),
                        'space_group': data.get('space_group', ''),
                        'filename': filename,
                        'atom_count': len(data.get('atoms', []))
                    }
                except Exception as e:
                    print(f"Error parsing {filename}: {e}")
        
        self._save_index()
    
    def _save_index(self):
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(self.index, f, ensure_ascii=False, indent=2)
    
    def list_crystals(self, search=''):
        results = list(self.index.values())
        if search:
            search_lower = search.lower()
            results = [
                c for c in results
                if search_lower in c['name'].lower() or
                   search_lower in c['formula'].lower() or
                   search_lower in c.get('space_group', '').lower()
            ]
        return results
    
    def get_crystal(self, id):
        if id not in self.index:
            return None
        
        info = self.index[id]
        filepath = os.path.join(self.cif_dir, info['filename'])
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        data = self.parser.parse(content)
        data['id'] = id
        return data
