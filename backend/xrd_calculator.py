import numpy as np

class XRDCalculator:
    def __init__(self):
        self.wavelengths = {
            'CuKa': 1.5406,
            'CuKa1': 1.54056,
            'CuKa2': 1.54439,
            'MoKa': 0.71073,
            'CrKa': 2.2910
        }
    
    def calculate_xrd(self, crystal_data, wavelength='CuKa', two_theta_min=5, two_theta_max=90, steps=1000):
        cell = crystal_data['cell']
        atoms = crystal_data['atoms']
        
        wavelength = self.wavelengths.get(wavelength, 1.5406)
        
        a, b, c = cell['a'], cell['b'], cell['c']
        alpha = np.radians(cell['alpha'])
        beta = np.radians(cell['beta'])
        gamma = np.radians(cell['gamma'])
        
        V = self._cell_volume(a, b, c, alpha, beta, gamma)
        
        G = self._metric_tensor(a, b, c, alpha, beta, gamma)
        G_star = np.linalg.inv(G)
        
        peaks = []
        max_h = int(np.ceil(2 * a / wavelength)) + 1
        max_k = int(np.ceil(2 * b / wavelength)) + 1
        max_l = int(np.ceil(2 * c / wavelength)) + 1
        
        for h in range(-max_h, max_h + 1):
            for k in range(-max_k, max_k + 1):
                for l in range(-max_l, max_l + 1):
                    if h == 0 and k == 0 and l == 0:
                        continue
                    
                    hkl = np.array([h, k, l])
                    d_squared = 1.0 / (hkl @ G_star @ hkl.T)
                    
                    if d_squared <= 0:
                        continue
                    
                    d = np.sqrt(d_squared)
                    
                    if wavelength / (2 * d) > 1.0:
                        continue
                    
                    two_theta = 2 * np.degrees(np.arcsin(wavelength / (2 * d)))
                    
                    if two_theta < two_theta_min or two_theta > two_theta_max:
                        continue
                    
                    F = self._structure_factor(h, k, l, atoms, a, b, c, alpha, beta, gamma)
                    intensity = abs(F) ** 2
                    
                    if intensity < 1e-6:
                        continue
                    
                    peaks.append({
                        'h': h,
                        'k': k,
                        'l': l,
                        'd': d,
                        'two_theta': two_theta,
                        'intensity': intensity,
                        'F_real': F.real,
                        'F_imag': F.imag,
                        'F_abs': abs(F)
                    })
        
        peaks.sort(key=lambda x: x['two_theta'])
        
        unique_peaks = []
        seen = {}
        for peak in peaks:
            hkl = tuple(sorted([abs(peak['h']), abs(peak['k']), abs(peak['l'])], reverse=True))
            if hkl not in seen:
                seen[hkl] = peak
                unique_peaks.append(peak)
        
        unique_peaks.sort(key=lambda x: x['two_theta'])
        
        if unique_peaks:
            max_intensity = max(p['intensity'] for p in unique_peaks)
            for p in unique_peaks:
                p['intensity'] = p['intensity'] / max_intensity * 100
        
        pattern = self._generate_pattern(unique_peaks, two_theta_min, two_theta_max, steps, wavelength)
        
        return {
            'peaks': unique_peaks,
            'pattern': pattern,
            'wavelength': wavelength,
            'two_theta_min': two_theta_min,
            'two_theta_max': two_theta_max
        }
    
    def _cell_volume(self, a, b, c, alpha, beta, gamma):
        return a * b * c * np.sqrt(
            1 - np.cos(alpha)**2 - np.cos(beta)**2 - np.cos(gamma)**2 +
            2 * np.cos(alpha) * np.cos(beta) * np.cos(gamma)
        )
    
    def _metric_tensor(self, a, b, c, alpha, beta, gamma):
        return np.array([
            [a*a, a*b*np.cos(gamma), a*c*np.cos(beta)],
            [a*b*np.cos(gamma), b*b, b*c*np.cos(alpha)],
            [a*c*np.cos(beta), b*c*np.cos(alpha), c*c]
        ])
    
    def _structure_factor(self, h, k, l, atoms, a, b, c, alpha, beta, gamma):
        F = 0.0 + 0.0j
        
        for atom in atoms:
            occ = atom.get('occupancy', 1.0)
            f = self._atomic_scattering_factor(atom['element'], h, k, l, a, b, c)
            phase = 2 * np.pi * (h * atom['fract_x'] + k * atom['fract_y'] + l * atom['fract_z'])
            F += occ * f * (np.cos(phase) + 1j * np.sin(phase))
        
        return F
    
    def _atomic_scattering_factor(self, element, h, k, l, a, b, c):
        factors = {
            'H': 1.0, 'He': 2.0, 'Li': 3.0, 'Be': 4.0, 'B': 5.0,
            'C': 6.0, 'N': 7.0, 'O': 8.0, 'F': 9.0, 'Ne': 10.0,
            'Na': 11.0, 'Mg': 12.0, 'Al': 13.0, 'Si': 14.0, 'P': 15.0,
            'S': 16.0, 'Cl': 17.0, 'Ar': 18.0, 'K': 19.0, 'Ca': 20.0,
            'Sc': 21.0, 'Ti': 22.0, 'V': 23.0, 'Cr': 24.0, 'Mn': 25.0,
            'Fe': 26.0, 'Co': 27.0, 'Ni': 28.0, 'Cu': 29.0, 'Zn': 30.0,
            'Ga': 31.0, 'Ge': 32.0, 'As': 33.0, 'Se': 34.0, 'Br': 35.0,
            'Kr': 36.0, 'Rb': 37.0, 'Sr': 38.0, 'Y': 39.0, 'Zr': 40.0,
            'Nb': 41.0, 'Mo': 42.0, 'Tc': 43.0, 'Ru': 44.0, 'Rh': 45.0,
            'Pd': 46.0, 'Ag': 47.0, 'Cd': 48.0, 'In': 49.0, 'Sn': 50.0,
            'Sb': 51.0, 'Te': 52.0, 'I': 53.0, 'Xe': 54.0, 'Cs': 55.0,
            'Ba': 56.0, 'La': 57.0, 'Ce': 58.0, 'Pr': 59.0, 'Nd': 60.0,
            'Pm': 61.0, 'Sm': 62.0, 'Eu': 63.0, 'Gd': 64.0, 'Tb': 65.0,
            'Dy': 66.0, 'Ho': 67.0, 'Er': 68.0, 'Tm': 69.0, 'Yb': 70.0,
            'Lu': 71.0, 'Hf': 72.0, 'Ta': 73.0, 'W': 74.0, 'Re': 75.0,
            'Os': 76.0, 'Ir': 77.0, 'Pt': 78.0, 'Au': 79.0, 'Hg': 80.0,
            'Tl': 81.0, 'Pb': 82.0, 'Bi': 83.0, 'Po': 84.0, 'At': 85.0,
            'Rn': 86.0, 'Fr': 87.0, 'Ra': 88.0, 'Ac': 89.0, 'Th': 90.0,
            'Pa': 91.0, 'U': 92.0
        }
        
        base_z = factors.get(element, 6.0)
        
        s = np.sqrt(h*h + k*k + l*l) / (2 * max(a, b, c))
        f = base_z * np.exp(-2 * s**2)
        
        return max(0.1, f)
    
    def _generate_pattern(self, peaks, two_theta_min, two_theta_max, steps, wavelength):
        two_theta = np.linspace(two_theta_min, two_theta_max, steps)
        intensity = np.zeros_like(two_theta)
        
        for peak in peaks:
            idx = np.argmin(np.abs(two_theta - peak['two_theta']))
            sigma = 0.1
            gaussian = peak['intensity'] * np.exp(-(two_theta - peak['two_theta'])**2 / (2 * sigma**2))
            intensity += gaussian
        
        return {
            'two_theta': two_theta.tolist(),
            'intensity': intensity.tolist()
        }
