import numpy as np
import re

class CIFParser:
    def __init__(self):
        self.element_colors = {
            'H': '#FFFFFF', 'He': '#D9FFFF', 'Li': '#CC80FF', 'Be': '#C2FF00',
            'B': '#FFB5B5', 'C': '#909090', 'N': '#3050F8', 'O': '#FF0D0D',
            'F': '#90E050', 'Ne': '#B3E3F5', 'Na': '#AB5CF2', 'Mg': '#8AFF00',
            'Al': '#BFA6A6', 'Si': '#F0C8A0', 'P': '#FF8000', 'S': '#FFFF30',
            'Cl': '#1FF01F', 'Ar': '#80D1E3', 'K': '#8F40D4', 'Ca': '#3DFF00',
            'Sc': '#E6E6E6', 'Ti': '#BFC2C7', 'V': '#A6A6AB', 'Cr': '#8A99C7',
            'Mn': '#9C7AC7', 'Fe': '#E06633', 'Co': '#F090A0', 'Ni': '#50D050',
            'Cu': '#C88033', 'Zn': '#7D80B0', 'Ga': '#C28F8F', 'Ge': '#668F8F',
            'As': '#BD80E3', 'Se': '#FFA100', 'Br': '#A62929', 'Kr': '#5CB8D1',
            'Rb': '#702EB0', 'Sr': '#00FF00', 'Y': '#94FFFF', 'Zr': '#94E0E0',
            'Nb': '#73C2C9', 'Mo': '#54B5B5', 'Tc': '#3B9E9E', 'Ru': '#248F8F',
            'Rh': '#0A7D8C', 'Pd': '#006985', 'Ag': '#C0C0C0', 'Cd': '#FFD98F',
            'In': '#A67573', 'Sn': '#668080', 'Sb': '#9E63B5', 'Te': '#D47A00',
            'I': '#940094', 'Xe': '#429EB0', 'Cs': '#57178F', 'Ba': '#00C900',
            'La': '#70D4FF', 'Ce': '#FFFFC7', 'Pr': '#D9FFC7', 'Nd': '#C7FFC7',
            'Pm': '#A3FFC7', 'Sm': '#8FFFC7', 'Eu': '#61FFC7', 'Gd': '#45FFC7',
            'Tb': '#30FFC7', 'Dy': '#1FFFC7', 'Ho': '#00FF9C', 'Er': '#00E675',
            'Tm': '#00D452', 'Yb': '#00BF38', 'Lu': '#00AB24', 'Hf': '#4DC2FF',
            'Ta': '#4DA6FF', 'W': '#2194D6', 'Re': '#267DAB', 'Os': '#266696',
            'Ir': '#175487', 'Pt': '#D0D0E0', 'Au': '#FFD123', 'Hg': '#B8B8D0',
            'Tl': '#A6544D', 'Pb': '#575961', 'Bi': '#9E4FB5', 'Po': '#AB5C00',
            'At': '#754F45', 'Rn': '#428296', 'Fr': '#420066', 'Ra': '#007D00',
            'Ac': '#70ABFA', 'Th': '#00BAFF', 'Pa': '#00A1FF', 'U': '#008FFF',
            'Np': '#0080FF', 'Pu': '#006BFF', 'Am': '#545CF2', 'Cm': '#785CE3',
            'Bk': '#8A4FE3', 'Cf': '#A136D4', 'Es': '#B31FD4', 'Fm': '#B31FBA',
            'Md': '#B30DA6', 'No': '#BD0D87', 'Lr': '#C70066', 'Rf': '#CC0059',
            'Db': '#D1004F', 'Sg': '#D90045', 'Bh': '#E00038', 'Hs': '#E6002E',
            'Mt': '#EB0026'
        }
    
    def hex_to_rgb(self, hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def rgb_to_hex(self, rgb):
        return '#{:02x}{:02x}{:02x}'.format(*[max(0, min(255, int(x))) for x in rgb])
    
    def mix_colors(self, colors, weights):
        total_weight = sum(weights)
        if total_weight == 0:
            return '#888888'
        normalized_weights = [w / total_weight for w in weights]
        
        rgb_colors = [self.hex_to_rgb(c) for c in colors]
        mixed_rgb = [
            sum(rgb[i] * w for rgb, w in zip(rgb_colors, normalized_weights))
            for i in range(3)
        ]
        return self.rgb_to_hex(mixed_rgb)
    
    def parse(self, cif_content):
        data = {
            'name': '',
            'formula': '',
            'space_group': '',
            'cell': {'a': 1, 'b': 1, 'c': 1, 'alpha': 90, 'beta': 90, 'gamma': 90},
            'atoms': [],
            'bonds': []
        }
        
        lines = cif_content.split('\n')
        in_loop = False
        loop_columns = []
        loop_data = []
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if line.startswith('data_'):
                data['name'] = line[5:]
                continue
            
            if line.startswith('_chemical_formula_sum'):
                parts = line.split(None, 1)
                if len(parts) > 1:
                    data['formula'] = parts[1].strip("'\"")
                continue
            
            if line.startswith('_space_group_name_H-M_alt'):
                parts = line.split(None, 1)
                if len(parts) > 1:
                    data['space_group'] = parts[1].strip("'\"")
                continue
            
            if line.startswith('_cell_length_a'):
                data['cell']['a'] = float(self._extract_number(line))
                continue
            if line.startswith('_cell_length_b'):
                data['cell']['b'] = float(self._extract_number(line))
                continue
            if line.startswith('_cell_length_c'):
                data['cell']['c'] = float(self._extract_number(line))
                continue
            if line.startswith('_cell_angle_alpha'):
                data['cell']['alpha'] = float(self._extract_number(line))
                continue
            if line.startswith('_cell_angle_beta'):
                data['cell']['beta'] = float(self._extract_number(line))
                continue
            if line.startswith('_cell_angle_gamma'):
                data['cell']['gamma'] = float(self._extract_number(line))
                continue
            
            if line.startswith('loop_'):
                in_loop = True
                loop_columns = []
                loop_data = []
                continue
            
            if in_loop:
                if line.startswith('_'):
                    loop_columns.append(line)
                else:
                    loop_data.append(line.split())
        
        atom_site_cols = ['_atom_site_label', '_atom_site_type_symbol', 
                          '_atom_site_fract_x', '_atom_site_fract_y', '_atom_site_fract_z']
        
        if all(col in loop_columns for col in atom_site_cols):
            idx_label = loop_columns.index('_atom_site_label')
            idx_type = loop_columns.index('_atom_site_type_symbol')
            idx_x = loop_columns.index('_atom_site_fract_x')
            idx_y = loop_columns.index('_atom_site_fract_y')
            idx_z = loop_columns.index('_atom_site_fract_z')
            idx_occ = loop_columns.index('_atom_site_occupancy') if '_atom_site_occupancy' in loop_columns else None
            
            raw_atoms = []
            for row in loop_data:
                if len(row) >= max(idx_label, idx_type, idx_x, idx_y, idx_z) + 1:
                    element = self._extract_element(row[idx_type])
                    occupancy = 1.0
                    if idx_occ is not None and len(row) > idx_occ:
                        try:
                            occupancy = float(self._extract_number(row[idx_occ]))
                        except:
                            occupancy = 1.0
                    
                    atom = {
                        'label': row[idx_label],
                        'element': element,
                        'fract_x': float(self._extract_number(row[idx_x])),
                        'fract_y': float(self._extract_number(row[idx_y])),
                        'fract_z': float(self._extract_number(row[idx_z])),
                        'occupancy': occupancy,
                        'color': self.element_colors.get(element, '#888888')
                    }
                    raw_atoms.append(atom)
            
            data['atoms'] = self._merge_disordered_atoms(raw_atoms)
        
        data['bonds'] = self._calculate_bonds(data['atoms'], data['cell'])
        
        return data
    
    def _extract_number(self, text):
        match = re.search(r'[-+]?\d*\.\d+|\d+', text)
        return match.group() if match else '0'
    
    def _extract_element(self, symbol):
        match = re.match(r'^([A-Z][a-z]?)', symbol)
        return match.group(1) if match else symbol
    
    def _merge_disordered_atoms(self, raw_atoms, tolerance=0.01):
        if not raw_atoms:
            return []
        
        full_occupancy_atoms = [a for a in raw_atoms if a['occupancy'] >= 1.0 - tolerance]
        partial_atoms = [a for a in raw_atoms if a['occupancy'] < 1.0 - tolerance]
        
        merged = full_occupancy_atoms.copy()
        
        used_indices = set()
        
        for i, atom1 in enumerate(partial_atoms):
            if i in used_indices:
                continue
            
            same_position_atoms = [atom1]
            used_indices.add(i)
            
            for j, atom2 in enumerate(partial_atoms):
                if j <= i or j in used_indices:
                    continue
                
                dx = abs(atom1['fract_x'] - atom2['fract_x'])
                dy = abs(atom1['fract_y'] - atom2['fract_y'])
                dz = abs(atom1['fract_z'] - atom2['fract_z'])
                
                dx = min(dx, 1 - dx)
                dy = min(dy, 1 - dy)
                dz = min(dz, 1 - dz)
                
                if dx < tolerance and dy < tolerance and dz < tolerance:
                    same_position_atoms.append(atom2)
                    used_indices.add(j)
            
            if len(same_position_atoms) == 1:
                merged.append(atom1)
            else:
                total_occ = sum(a['occupancy'] for a in same_position_atoms)
                elements = [a['element'] for a in same_position_atoms]
                occupancies = [a['occupancy'] for a in same_position_atoms]
                colors = [a['color'] for a in same_position_atoms]
                labels = [a['label'] for a in same_position_atoms]
                
                mixed_color = self.mix_colors(colors, occupancies)
                
                merged_atom = {
                    'label': '/'.join(labels),
                    'element': '/'.join(elements),
                    'fract_x': atom1['fract_x'],
                    'fract_y': atom1['fract_y'],
                    'fract_z': atom1['fract_z'],
                    'occupancy': total_occ,
                    'color': mixed_color,
                    'is_disordered': True,
                    'disordered_elements': elements,
                    'disordered_occupancies': occupancies,
                    'disordered_labels': labels
                }
                merged.append(merged_atom)
        
        return merged
    
    def _calculate_bonds(self, atoms, cell):
        bonds = []
        a, b, c = cell['a'], cell['b'], cell['c']
        alpha = np.radians(cell['alpha'])
        beta = np.radians(cell['beta'])
        gamma = np.radians(cell['gamma'])
        
        ax, ay, az = a, 0, 0
        bx = b * np.cos(gamma)
        by = b * np.sin(gamma)
        bz = 0
        cx = c * np.cos(beta)
        cy = c * (np.cos(alpha) - np.cos(beta) * np.cos(gamma)) / np.sin(gamma)
        cz = np.sqrt(c**2 - cx**2 - cy**2)
        
        def fract_to_cart(fx, fy, fz):
            x = fx * ax + fy * bx + fz * cx
            y = fx * ay + fy * by + fz * cy
            z = fx * az + fy * bz + fz * cz
            return np.array([x, y, z])
        
        for i, atom1 in enumerate(atoms):
            pos1 = fract_to_cart(atom1['fract_x'], atom1['fract_y'], atom1['fract_z'])
            for j, atom2 in enumerate(atoms):
                if i >= j:
                    continue
                pos2 = fract_to_cart(atom2['fract_x'], atom2['fract_y'], atom2['fract_z'])
                
                min_dist = float('inf')
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        for dz in [-1, 0, 1]:
                            offset = np.array([dx*ax + dy*bx + dz*cx, 
                                               dx*ay + dy*by + dz*cy,
                                               dx*az + dy*bz + dz*cz])
                            dist = np.linalg.norm(pos1 - (pos2 + offset))
                            if dist < min_dist:
                                min_dist = dist
                
                if min_dist < 2.5 and min_dist > 0.5:
                    bonds.append({
                        'atom1': i,
                        'atom2': j,
                        'length': round(min_dist, 3)
                    })
        
        return bonds
