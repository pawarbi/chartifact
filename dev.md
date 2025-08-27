# Jekyll Development with Docker

This repository includes Docker setup for running Jekyll locally to preview the GitHub Pages site.

## Quick Start

### Start Jekyll
```bash
docker-compose up
```

### View your site
Open http://localhost:4000/chartifact/ in your browser

### Stop Jekyll
Type ctrl-C in the terminal running `docker-compose up`

## Other useful commands

### Rebuild after changes
```bash
docker-compose build
```

## Files

- `Dockerfile` - Jekyll container setup
- `docker-compose.yml` - Container orchestration
- `docs/Gemfile` - Jekyll dependencies (same as GitHub Pages)
- `docs/_config.yml` - Jekyll configuration

The setup uses the same `github-pages` gem as GitHub Pages to ensure compatibility.
