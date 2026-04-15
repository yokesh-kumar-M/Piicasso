import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres.xwlugcmchccxgeseisfv:Makemehappy%402005@aws-0-ap-south-1.pooler.supabase.com:5432/postgres")
    print("Success")
except Exception as e:
    print("Failed:", e)
