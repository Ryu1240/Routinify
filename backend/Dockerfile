# syntax=docker/dockerfile:1
# check=error=true

# This Dockerfile is designed for production, not development. Use with Kamal or build'n'run by hand:
# docker build -t app .
# docker run -d -p 80:80 -e RAILS_MASTER_KEY=<value from config/master.key> --name app app

# For a containerized dev environment, see Dev Containers: https://guides.rubyonrails.org/getting_started_with_devcontainer.html

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
FROM ruby:3.4.2

RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev nodejs postgresql-client git

# ユーザーとグループの作成
RUN groupadd -r -g 1000 app && \
    useradd -r -u 1000 -g app app

WORKDIR /app

COPY Gemfile* ./
RUN bundle install

COPY . .

# ディレクトリの所有権を変更
RUN chown -R app:app /app

USER app

EXPOSE 3000

CMD ["rails", "server", "-b", "0.0.0.0"]
