import psycopg2
try:
    conn = psycopg2.connect(dbname="postgres", user="postgres.xwlugcmchccxgeseisfv", password="Makemehappy@2005", host="aws-0-ap-south-1.pooler.supabase.com", port=6543)
    print("Success 6543")
except Exception as e:
    print("Failed 6543:", e)

try:
    conn = psycopg2.connect(dbname="postgres", user="postgres.xwlugcmchccxgeseisfv", password="Makemehappy@2005", host="aws-0-ap-south-1.pooler.supabase.com", port=5432)
    print("Success 5432")
except Exception as e:
    print("Failed 5432:", e)
