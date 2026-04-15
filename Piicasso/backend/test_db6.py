import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres.xwlugcmchccxgeseisfv:Makemehappy%402005@pooler.supabase.com:6543/postgres")
    print("Success pooler")
except Exception as e:
    print("Failed pooler:", e)
