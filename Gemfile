source 'http://rubygems.org'

gem 'rails', '3.0.20'

gem "will_paginate", "~> 3.0.pre2"
gem 'jammit'
gem 'capistrano'

group :test do
  gem 'shoulda'
  gem 'machinist'
  gem 'faker'
end

group :development, :test do
  gem 'sqlite3-ruby', :require => 'sqlite3'
end

group :production do
  gem 'mysql2'
end
