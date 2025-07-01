import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import base64
import cv2
import numpy as np
import json
import requests
import re

app = Flask(__name__, template_folder=r'C:\Users\medhi\OneDrive\Documents\5th_sem\APP\Trial\Trial\templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://medhi:medhu@localhost/visitor_tracking'
# app.config['SQLALCHEMY_DATABASE_URI'] = "mysql://root:" + "Meena@123" + "@localhost/visit"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class VisitorDetails(db.Model):
    __tablename__ = 'visitors'  # Updated table name
    Visit_Id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Updated to auto-increment
    Visit_Name = db.Column(db.String(10), nullable=False)
    Email = db.Column(db.String(100))  
    Visit_Ph_Number = db.Column(db.String(10))
    Visit_Type = db.Column(db.String(10), nullable=True)
    From = db.Column(db.String(20), nullable=True)
    Visit_Flat_Number = db.Column(db.String(10), nullable=True)
    Image = db.Column(db.String(255), nullable=True)
    print(Visit_Flat_Number)
    # print("in the end of class")

class Resident(db.Model): 
    __tablename__ = 'residents'  
    Flat_Number = db.Column(db.Integer,primary_key=True) 
    Res_name = db.Column(db.String(10)) 
    Res_Ph_num = db.Column(db.String(10))

@app.route('/')
def index():
    # print("First time  get_visitor_details")
    # print("--------------------------")
    
    return render_template('index.html')

@app.route('/get_visitor', methods=['GET'])
def get_visitor_details():
    # print("Inside get_visitor_details")
    phone = request.args.get('visitor_phone')
    visitor = VisitorDetails.query.filter_by(Visit_Ph_Number=phone).first()

    if visitor:

          return jsonify({
            'visitor_name': visitor.Visit_Name, 
            'Email': visitor.Email,
            'visit_type': visitor.Visit_Type,
            'from_where': visitor.From, 
            'visit_flat': visitor.Visit_Flat_Number,
            'image_link': visitor.Image
         }) 
       
    else:
        return jsonify({
            'visitor_name': '', 
             'Email': '' ,
            'visit_type': '', 
            'from_where': '', 
            'visit_flat': '',
           'image_link': ''
        })
    
@app.route('/validate_flat', methods=['GET'])
def validate_flat():
    flat_no = request.args.get('flat_no')
    resident = Resident.query.filter_by(Flat_Number=flat_no).first()
    return jsonify({'valid': resident is not None})
    
def save_image(image_data, phone_num):
    alg = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    haar_cascade = cv2.CascadeClassifier(alg)
    if haar_cascade.empty():
        print("Error loading Haar cascade.")
        return "Error: Haar cascade not loaded"
    image_data = image_data.split(',')[1]
    image_data = base64.b64decode(image_data)
    np_image = np.frombuffer(image_data, dtype=np.uint8)
    img = cv2.imdecode(np_image, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = haar_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    print(len(faces))
    if(len(faces)>1):
        return "Error!"
    else:
     image_path = f"static/images/{phone_num}.jpg"
     cv2.imwrite(image_path, img)
    return image_path

def send_email_to_visitor(email, name, flat, visit_id):
    payload = {
        "to": email,
        "subject": "Your Digital Entry Pass",
        "message": f"""
Hello {name},

You are approved to visit Flat {flat}.
This is your visitor pass. 
Pass ID: {visit_id} """
    }
    requests.post("https://email-backend-1-kh29.onrender.com/sendEmail", json=payload)

# @app.route('/add_visitor', methods=['POST'])
# def add_visitor_details():
#     print("Inside add_visitor_details")
#     data = request.form
#     print("Visitor name: ", data['visitor_name'])
#     print("Visit type: ", data['visit_type'])

#     image_data = data['imageData']
#     existing_visitor = VisitorDetails.query.filter_by(Visit_Ph_Number=data['visitor_phone']).first()

#     if image_data:
#         image_path = save_image(image_data, data['visitor_phone']) 
#         if image_path == "Error!":
#             return "Multiple faces detected"
#     else:
#         image_path = existing_visitor.Image if existing_visitor else None

#     if existing_visitor:
#         print("Visitor exists — updating record.")
#         existing_visitor.Visit_Name = data['visitor_name']
#         existing_visitor.Visit_Type = data['visit_type']
#         existing_visitor.From = data['from_where']
#         existing_visitor.Visit_Flat_Number = data['visit_flat']
#         existing_visitor.Image = image_path
#         existing_visitor.Email = data['Email']
#         visitor = existing_visitor
#     else:
#         print("Visitor does not exist — adding new record.")
#         visitor = VisitorDetails(
#             Visit_Ph_Number=data['visitor_phone'], 
#             Visit_Name=data['visitor_name'], 
#             Visit_Type=data['visit_type'], 
#             From=data['from_where'], 
#             Visit_Flat_Number=data['visit_flat'],
#             Image=image_path,
#             Email=data['Email'],
#         )
#         db.session.add(visitor)
  
#     db.session.commit()
#     visit_id = visitor.Visit_Id
#     send_email_to_visitor(visitor.Email, visitor.Visit_Name, visitor.Visit_Flat_Number, visit_id)
#     return 'Success'
@app.route('/add_visitor', methods=['POST'])
def add_visitor_details():
    try:
        print("Inside add_visitor_details")
        data = request.form

        # Extract data
        phone = data['visitor_phone']
        email = data['Email']  # match your field name
        name = data['visitor_name']
        vtype = data['visit_type']
        fromw = data['from_where']
        flat = data['visit_flat']
        image_data = data['imageData']

        #  Validations
        if not re.match(r'^\d{10}$', phone):
            return jsonify({'success': False, 'message': 'Phone number must be exactly 10 digits'})

        if not email or not re.match(r'^[\w\.-]+@[\w\.-]+\.\w{2,}$', email):
            return jsonify({'success': False, 'message': 'Invalid email address'})

        if not all([name, vtype, fromw, flat]):
            return jsonify({'success': False, 'message': 'All fields are required'})

        if not image_data:
            return jsonify({'success': False, 'message': 'Image is required'})

        #  Check if flat number exists in Residents table
        resident = Resident.query.filter_by(Flat_Number=flat).first()
        if not resident:
            return jsonify({'success': False, 'message': 'Invalid flat number. No such resident exists.'})

        #  Check for existing visitor
        existing_visitor = VisitorDetails.query.filter_by(Visit_Ph_Number=phone).first()

        #  Save new image or reuse
        if image_data.startswith('data:image'):
            image_path = save_image(image_data, phone)
            if image_path == "Error!":
                return jsonify({'success': False, 'message': 'Multiple faces detected in image'})
        else:
            image_path = existing_visitor.Image if existing_visitor else None

        #  Update or Insert
        if existing_visitor:
            print("Visitor exists — updating record.")
            existing_visitor.Visit_Name = name
            existing_visitor.Email = email
            existing_visitor.Visit_Type = vtype
            existing_visitor.From = fromw
            existing_visitor.Visit_Flat_Number = flat
            existing_visitor.Image = image_path
            visitor = existing_visitor
        else:
            print("Visitor does not exist — adding new record.")
            visitor = VisitorDetails(
                Visit_Ph_Number=phone,
                Visit_Name=name,
                Visit_Type=vtype,
                From=fromw,
                Visit_Flat_Number=flat,
                Image=image_path,
                Email=email,
            )
            db.session.add(visitor)

        db.session.commit()

        # Email pass
        visit_id = visitor.Visit_Id  # assuming Visit_Id is a field in your model
        send_email_to_visitor(visitor.Email, visitor.Visit_Name, visitor.Visit_Flat_Number, visit_id)

        return jsonify({'success': True, 'message': 'Visitor details submitted successfully!'})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})



if __name__ == '__main__':
    app.run(debug=True,port=5001)


