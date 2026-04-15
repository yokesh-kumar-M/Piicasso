import psycopg2
import urllib.parse
password = urllib.parse.unquote('Makemehappy%402005')
try:
    conn = psycopg2.connect(f"postgresql://postgres.xwlugcmchccxgeseisfv:{password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
    print("Success 6543")
except Exception as e:
    print("Failed 6543:", e)

try:
    conn = psycopg2.connect(f"postgresql://postgres.xwlugcmchccxgeseisfv:{password}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres")
    print("Success 5432")
except Exception as e:
    print("Failed 5432:", e)
