# Jekyll Local Development with Docker

This repository includes Docker setup for running Jekyll locally to preview the GitHub Pages site.

## Quick Start

### Start Jekyll
```bash
docker-compose -f docker-compose.jekyll-local.yml up
```

### View your site
Open http://localhost:4000/chartifact/ in your browser

### Stop Jekyll
Type ctrl-C in the terminal running `docker-compose up`

## Other useful commands

### Rebuild after changes
```bash
docker-compose -f docker-compose.jekyll-local.yml build
```

## Files

- `Dockerfile.jekyll-local` - Jekyll container setup for local development
- `docker-compose.jekyll-local.yml` - Container orchestration for local development
- `docs/Gemfile` - Jekyll dependencies (same as GitHub Pages)
- `docs/_config.yml` - Jekyll configuration

The setup uses the same `github-pages` gem as GitHub Pages to ensure compatibility.
