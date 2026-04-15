import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres.xwlugcmchccxgeseisfv:Makemehappy%402005@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require")
    print("Success 6543 require")
except Exception as e:
    print("Failed 6543 require:", e)
