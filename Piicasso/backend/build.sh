set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --no-input
# NOTE: never run makemigrations at deploy time — migrations are committed to
# the repo and applied with `migrate`. Generating them in prod risks schema
# drift between environments.
python manage.py migrate
