from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
from cif_parser import CIFParser
from crystal_library import CrystalLibrary
from xrd_calculator import XRDCalculator

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CIF_DIR = os.path.join(BASE_DIR, 'cif_files')
os.makedirs(CIF_DIR, exist_ok=True)

cif_parser = CIFParser()
crystal_lib = CrystalLibrary(CIF_DIR)
xrd_calc = XRDCalculator()

@app.route('/api/crystals', methods=['GET'])
def list_crystals():
    search = request.args.get('search', '')
    crystals = crystal_lib.list_crystals(search)
    return jsonify(crystals)

@app.route('/api/crystals/<id>', methods=['GET'])
def get_crystal(id):
    try:
        crystal_data = crystal_lib.get_crystal(id)
        if crystal_data:
            return jsonify(crystal_data)
        return jsonify({'error': 'Crystal not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crystals', methods=['POST'])
def upload_crystal():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and file.filename.endswith('.cif'):
            filepath = os.path.join(CIF_DIR, file.filename)
            file.save(filepath)
            crystal_lib.refresh()
            return jsonify({'message': 'File uploaded successfully'})
        
        return jsonify({'error': 'Invalid file format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/parse-cif', methods=['POST'])
def parse_cif():
    try:
        if 'file' in request.files:
            file = request.files['file']
            content = file.read().decode('utf-8')
        elif 'content' in request.json:
            content = request.json['content']
        else:
            return jsonify({'error': 'No content provided'}), 400
        
        crystal_data = cif_parser.parse(content)
        return jsonify(crystal_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/symmetry-operations', methods=['GET'])
def get_symmetry_operations():
    operations = [
        {'id': 'identity', 'name': '恒等操作', 'description': 'E: 不改变晶体', 'matrix': [[1,0,0],[0,1,0],[0,0,1]]},
        {'id': 'inversion', 'name': '反演中心', 'description': 'i: 通过原点反演', 'matrix': [[-1,0,0],[0,-1,0],[0,0,-1]]},
        {'id': 'rotation_2', 'name': '二次旋转轴', 'description': 'C₂: 绕轴旋转180°', 'matrix': [[-1,0,0],[0,-1,0],[0,0,1]]},
        {'id': 'rotation_3', 'name': '三次旋转轴', 'description': 'C₃: 绕轴旋转120°', 'matrix': [[-0.5,-0.866,0],[0.866,-0.5,0],[0,0,1]]},
        {'id': 'rotation_4', 'name': '四次旋转轴', 'description': 'C₄: 绕轴旋转90°', 'matrix': [[0,-1,0],[1,0,0],[0,0,1]]},
        {'id': 'rotation_6', 'name': '六次旋转轴', 'description': 'C₆: 绕轴旋转60°', 'matrix': [[0.5,-0.866,0],[0.866,0.5,0],[0,0,1]]},
        {'id': 'mirror_xy', 'name': '镜面反射(xy)', 'description': 'σ: xy平面反射', 'matrix': [[1,0,0],[0,1,0],[0,0,-1]]},
        {'id': 'mirror_xz', 'name': '镜面反射(xz)', 'description': 'σ: xz平面反射', 'matrix': [[1,0,0],[0,-1,0],[0,0,1]]},
        {'id': 'mirror_yz', 'name': '镜面反射(yz)', 'description': 'σ: yz平面反射', 'matrix': [[-1,0,0],[0,1,0],[0,0,1]]}
    ]
    return jsonify(operations)

@app.route('/api/questions', methods=['GET'])
def get_questions():
    category = request.args.get('category', 'all')
    with open(os.path.join(BASE_DIR, 'questions.json'), 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    if category != 'all':
        questions = [q for q in questions if q['category'] == category]
    
    return jsonify(questions)

@app.route('/api/cif-files/<filename>')
def serve_cif(filename):
    return send_from_directory(CIF_DIR, filename)

@app.route('/api/xrd/<crystal_id>', methods=['GET'])
def calculate_xrd(crystal_id):
    try:
        crystal_data = crystal_lib.get_crystal(crystal_id)
        if not crystal_data:
            return jsonify({'error': 'Crystal not found'}), 404
        
        wavelength = request.args.get('wavelength', 'CuKa')
        two_theta_min = float(request.args.get('min', 5))
        two_theta_max = float(request.args.get('max', 90))
        steps = int(request.args.get('steps', 1000))
        
        xrd_data = xrd_calc.calculate_xrd(
            crystal_data,
            wavelength=wavelength,
            two_theta_min=two_theta_min,
            two_theta_max=two_theta_max,
            steps=steps
        )
        
        return jsonify(xrd_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/xrd/wavelengths', methods=['GET'])
def get_wavelengths():
    wavelengths = [
        {'id': 'CuKa', 'name': 'Cu Kα', 'value': 1.5406, 'unit': 'Å'},
        {'id': 'CuKa1', 'name': 'Cu Kα₁', 'value': 1.54056, 'unit': 'Å'},
        {'id': 'CuKa2', 'name': 'Cu Kα₂', 'value': 1.54439, 'unit': 'Å'},
        {'id': 'MoKa', 'name': 'Mo Kα', 'value': 0.71073, 'unit': 'Å'},
        {'id': 'CrKa', 'name': 'Cr Kα', 'value': 2.2910, 'unit': 'Å'}
    ]
    return jsonify(wavelengths)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
