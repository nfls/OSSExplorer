git submodule update --init --recursive --remote
npm install
composer install --ignore-platform-reqs
./node_modules/.bin/encore production
bin/console cache:clear
bin/console cache:warmup --env=prod
