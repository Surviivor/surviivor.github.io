"""Opération ponctuelle : lots des ligues (50 € en bon d'achat Decathlon) et suppression du maillot de Kaká."""
import json, os, re
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate(json.loads(os.environ['FIREBASE_SERVICE_ACCOUNT']))
firebase_admin.initialize_app(cred)
db = firestore.client()
TARGETS = [r'^\s*survivor\s*x\s*ligue\s*1\s*$', r'^\s*survivor\s*x\s*premi[eè]re?\s*league\s*$', r'^\s*race\s*x\s*ligue\s*1\s*$']
for doc in db.collection('leagues').stream():
    d = doc.to_dict() or {}
    name = d.get('name', '')
    patch = {}
    if any(re.match(t, name, re.I) for t in TARGETS):
        patch = {'prize': "en bon d'achat Decathlon", 'prizeVal': '50€'}
    elif re.search(r'kak[aá]', str(d.get('prize', '')), re.I):
        patch = {'prize': ''}
    if patch:
        doc.reference.update(patch)
        print('maj', doc.id, name, patch)
    else:
        print('--', doc.id, name, repr(d.get('prize')))
