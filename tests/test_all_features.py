import os
import io
import unittest
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.announcement import Announcement
from app.models.document import Document
from app.models.schedule import Schedule
from app.models.interukm import InterUKMPost
from app.models.email_log import EmailLog
from app.models.audit_log import AuditLog

class SiomasApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.ctx = cls.app.app_context()
        cls.ctx.push()

        # Seed or ensure users exist for test: Admin, Pengurus, Anggota
        admin = User.query.filter_by(Email='admin@siomas.com').first()
        if not admin:
            admin = User(Nama='Admin Test', Email='admin@siomas.com', Role='Admin', Status_Keanggotaan='Aktif')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()

        # Pengurus user
        pengurus = User.query.filter_by(Email='pengurus@siomas.com').first()
        if not pengurus:
            pengurus = User(Nama='Pengurus Test', Email='pengurus@siomas.com', Role='Pengurus', Job_Desc='Sekretaris', Status_Keanggotaan='Aktif')
            pengurus.set_password('pengurus123')
            db.session.add(pengurus)
            db.session.commit()
        cls.pengurus = pengurus

        # Anggota user
        anggota = User.query.filter_by(Email='anggota@siomas.com').first()
        if not anggota:
            anggota = User(Nama='Anggota Test', Email='anggota@siomas.com', Role='Anggota', Job_Desc='Anggota Acara', Status_Keanggotaan='Aktif')
            anggota.set_password('anggota123')
            db.session.add(anggota)
            db.session.commit()
        cls.anggota = anggota

        # Login admin
        res_admin = cls.client.post('/api/v1/auth/login', json={'email': 'admin@siomas.com', 'password': 'admin123'})
        cls.admin_token = res_admin.get_json()['data']['access_token']
        cls.admin_headers = {'Authorization': f'Bearer {cls.admin_token}'}

        # Login pengurus
        res_pengurus = cls.client.post('/api/v1/auth/login', json={'email': 'pengurus@siomas.com', 'password': 'pengurus123'})
        cls.pengurus_token = res_pengurus.get_json()['data']['access_token']
        cls.pengurus_headers = {'Authorization': f'Bearer {cls.pengurus_token}'}

        # Login anggota
        res_anggota = cls.client.post('/api/v1/auth/login', json={'email': 'anggota@siomas.com', 'password': 'anggota123'})
        cls.anggota_token = res_anggota.get_json()['data']['access_token']
        cls.anggota_headers = {'Authorization': f'Bearer {cls.anggota_token}'}

    @classmethod
    def tearDownClass(cls):
        cls.ctx.pop()

    def test_01_index_and_swagger(self):
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['status'], 'Running')

        res_swagger = self.client.get('/apidocs/')
        self.assertEqual(res_swagger.status_code, 200)

        res_spec = self.client.get('/apispec_1.json')
        self.assertEqual(res_spec.status_code, 200)

    def test_02_uc01_profile_and_jobdesk(self):
        # Admin profile
        res = self.client.get('/api/v1/profile/me', headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()['data']
        self.assertEqual(data['role'], 'Admin')
        self.assertIn('buat_pengumuman', data['permissions'])

        # Update profile
        update_res = self.client.put('/api/v1/profile/me', headers=self.anggota_headers, json={'nama': 'Anggota Updated'})
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()['data']['nama'], 'Anggota Updated')

        # Jobdesk list
        job_res = self.client.get('/api/v1/profile/jobdesk', headers=self.anggota_headers)
        self.assertEqual(job_res.status_code, 200)
        self.assertIsInstance(job_res.get_json()['data'], list)

    def test_03_uc02_rbac_access_control(self):
        # Anggota attempts to access Admin-only /api/v1/auth/users -> should get 403 Forbidden!
        res = self.client.get('/api/v1/auth/users', headers=self.anggota_headers)
        self.assertEqual(res.status_code, 403)

        # Pengurus has access to list users
        res_pengurus = self.client.get('/api/v1/auth/users', headers=self.pengurus_headers)
        self.assertEqual(res_pengurus.status_code, 200)

    def test_04_uc05_and_uc03_announcements(self):
        # Admin creates announcement (UC-05)
        create_res = self.client.post(
            '/api/v1/admin/announcements',
            headers=self.admin_headers,
            json={
                'judul': 'Pengumuman Penting Pleno 2026',
                'isi': 'Harap seluruh anggota hadir tepat waktu pada pleno bulan ini.',
                'is_important': True
            }
        )
        self.assertEqual(create_res.status_code, 201)
        announce_id = create_res.get_json()['data']['announcement']['id']

        # Anggota lists announcements (UC-03)
        list_res = self.client.get('/api/v1/announcements', headers=self.anggota_headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertTrue(any(a['id'] == announce_id for a in list_res.get_json()['data']))

        # Anggota reads detail -> auto marked as read
        read_res = self.client.get(f'/api/v1/announcements/{announce_id}', headers=self.anggota_headers)
        self.assertEqual(read_res.status_code, 200)
        self.assertTrue(read_res.get_json()['data']['is_read'])

        # Admin views readers (UC-05)
        readers_res = self.client.get(f'/api/v1/admin/announcements/{announce_id}/readers', headers=self.admin_headers)
        self.assertEqual(readers_res.status_code, 200)
        self.assertGreaterEqual(readers_res.get_json()['data']['read_count'], 1)

    def test_05_uc04_schedules(self):
        # Pengurus creates schedule
        create_res = self.client.post(
            '/api/v1/schedules',
            headers=self.pengurus_headers,
            json={
                'judul_kegiatan': 'Workshop Flask & REST API',
                'kategori': 'Pelatihan',
                'waktu': '2026-11-20 10:00:00',
                'lokasi': 'Lab Komputer 3',
                'keterangan': 'Gratis untuk seluruh pengurus dan anggota'
            }
        )
        self.assertEqual(create_res.status_code, 201)
        schedule_id = create_res.get_json()['data']['id']

        # Anggota views schedules
        list_res = self.client.get('/api/v1/schedules', headers=self.anggota_headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertTrue(any(s['id'] == schedule_id for s in list_res.get_json()['data']))

        # Anggota tries to create schedule -> should be rejected with 403 (Anggota has only 'lihat_jadwal')
        forbidden_res = self.client.post(
            '/api/v1/schedules',
            headers=self.anggota_headers,
            json={
                'judul_kegiatan': 'Jadwal Ilegal',
                'waktu': '2026-11-25 10:00:00'
            }
        )
        self.assertEqual(forbidden_res.status_code, 403)

    def test_06_uc06_and_uc09_lpj_workflow(self):
        # Pengurus uploads draft LPJ (UC-06)
        fake_file = io.BytesIO(b"Dummy LPJ PDF Content 2026")
        upload_res = self.client.post(
            '/api/v1/lpj/upload',
            headers=self.pengurus_headers,
            data={
                'nama_berkas': 'LPJ Kegiatan LDKM 2026.pdf',
                'file': (fake_file, 'lpj_ldkm_2026.pdf')
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(upload_res.status_code, 201)
        doc_id = upload_res.get_json()['data']['id']
        self.assertEqual(upload_res.get_json()['data']['status'], 'Draft')

        # Admin checks pending LPJ validation queue (UC-09)
        pending_res = self.client.get('/api/v1/lpj-validation/pending', headers=self.admin_headers)
        self.assertEqual(pending_res.status_code, 200)
        self.assertTrue(any(d['id'] == doc_id for d in pending_res.get_json()['data']))

        # Admin validates LPJ to Approved (UC-09)
        validate_res = self.client.post(
            f'/api/v1/lpj-validation/{doc_id}/validate',
            headers=self.admin_headers,
            json={
                'status': 'Approved',
                'catatan_revisi': 'Laporan keuangan lengkap dan disetujui.'
            }
        )
        self.assertEqual(validate_res.status_code, 200)
        self.assertEqual(validate_res.get_json()['data']['document']['status'], 'Approved')

    def test_07_uc08_sipakamase_workflow(self):
        # Pengurus uploads Sipakamase document
        fake_file = io.BytesIO(b"Dummy Sipakamase Document Content")
        upload_res = self.client.post(
            '/api/v1/sipakamase/upload',
            headers=self.pengurus_headers,
            data={
                'nama_berkas': 'Berkas Sipakamase Semester Gasal 2026.pdf',
                'file': (fake_file, 'sipakamase_gasal.pdf')
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(upload_res.status_code, 201)
        doc_id = upload_res.get_json()['data']['id']

        # Admin verifies Sipakamase document
        verify_res = self.client.post(
            f'/api/v1/sipakamase/{doc_id}/verify',
            headers=self.admin_headers,
            json={
                'status': 'Approved',
                'catatan': 'Sesuai dengan kriteria Sipakamase UKM.'
            }
        )
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_res.get_json()['data']['document']['status'], 'Approved')

    def test_08_uc10_documents_archive_and_download(self):
        # List archived documents
        list_res = self.client.get('/api/v1/documents', headers=self.anggota_headers)
        self.assertEqual(list_res.status_code, 200)
        docs = list_res.get_json()['data']
        self.assertGreater(len(docs), 0)

        # Download first document
        first_doc = docs[0]
        dl_res = self.client.get(f'/api/v1/documents/{first_doc["id"]}/download', headers=self.anggota_headers)
        self.assertEqual(dl_res.status_code, 200)

    def test_09_uc11_interukm(self):
        # Pengurus drafts inter-UKM post
        create_res = self.client.post(
            '/api/v1/interukm/posts',
            headers=self.pengurus_headers,
            json={
                'ukm_pengirim': 'UKM Seni & Budaya',
                'judul': 'Kolaborasi Festival Budaya Kampus 2026',
                'isi_pengumuman': 'Mengajak seluruh organisasi untuk mengisi stand pameran budaya.'
            }
        )
        self.assertEqual(create_res.status_code, 201)
        post_id = create_res.get_json()['data']['id']

        # Admin views pending posts
        pending_res = self.client.get('/api/v1/interukm/posts/pending', headers=self.admin_headers)
        self.assertEqual(pending_res.status_code, 200)
        self.assertTrue(any(p['id'] == post_id for p in pending_res.get_json()['data']))

        # Admin approves post
        approve_res = self.client.post(f'/api/v1/interukm/posts/{post_id}/approve', headers=self.admin_headers)
        self.assertEqual(approve_res.status_code, 200)

        # Feed contains approved post
        feed_res = self.client.get('/api/v1/interukm/feed', headers=self.anggota_headers)
        self.assertEqual(feed_res.status_code, 200)
        self.assertTrue(any(p['id'] == post_id for p in feed_res.get_json()['data']))

    def test_10_uc12_notifications_and_audit_logs(self):
        # Create announcement for email testing
        ann_res = self.client.post(
            '/api/v1/admin/announcements',
            headers=self.admin_headers,
            json={
                'judul': 'Pengumuman Uji Notifikasi Email',
                'isi': 'Pengujian mekanisme retry dan email log.'
            }
        )
        ann_id = ann_res.get_json()['data']['announcement']['id']

        # Trigger email send
        send_res = self.client.post(
            '/api/v1/notifications/email/send',
            headers=self.admin_headers,
            json={
                'announcement_id': ann_id,
                'target_scope': 'all'
            }
        )
        self.assertEqual(send_res.status_code, 200)
        self.assertGreater(send_res.get_json()['data']['total_recipients'], 0)

        # Check email logs
        logs_res = self.client.get(f'/api/v1/notifications/email-logs?announcement_id={ann_id}', headers=self.admin_headers)
        self.assertEqual(logs_res.status_code, 200)
        self.assertGreater(len(logs_res.get_json()['data']), 0)

        # Check audit logs (Admin only)
        audit_res = self.client.get('/api/v1/notifications/audit-logs', headers=self.admin_headers)
        self.assertEqual(audit_res.status_code, 200)
        self.assertGreater(len(audit_res.get_json()['data']), 0)

        # Anggota cannot access audit logs -> 403 Forbidden!
        audit_forbidden = self.client.get('/api/v1/notifications/audit-logs', headers=self.anggota_headers)
        self.assertEqual(audit_forbidden.status_code, 403)

if __name__ == '__main__':
    unittest.main()
