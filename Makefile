bin = ./node_modules/.bin

ifneq (CI,1)
SILENT += >/dev/null
endif

# Logging

__blue = $$(tput setaf 4)
__normal = $$(tput sgr0)
title = $(shell pwd | xargs basename)
log = printf "$(__blue)$(title): $(__normal) %s\\n"

help: ## Show this help.
	@echo 'NTSer'
	@echo 'Please use one of these make rules:'
	@echo
	@grep '##' $(MAKEFILE_LIST) | grep -v 'grep' | awk -F ': ##' '{ printf("%18s  %s\n", $$1, $$2) }'
	@echo

bundle: build app

start: ## Start the app, making sure it is build to the latest version
start: NODE_ENV = development
start: ESBUILD_FLAGS =
start: index preload run

run: ## Run the application (not recommended, use start instead)
run:
	@$(log) "Running app"
	@# --use-mock-keychain keeps the unsigned development build from asking for
	@# keychain access on every launch. This rule only ever runs unpackaged code,
	@# so the packaged app still uses the real keychain.
	@$(bin)/electron dist --use-mock-keychain

build: ## Build all the JavaScript, without bundling the Electron app
build: index preload client packages

# GitHub Actions sets CI=true. Build both Mac chips there so each user
# downloads one copy of Chromium; locally, only the machine you are on.
ifeq ($(CI),true)
MAC_ARCHS ?= --arm64 --x64
endif

.PHONY: app
app: ## Build the electron app for this Mac (both chips on CI)
app:
	@$(log) "Bundling app..."
	@$(bin)/electron-builder build --mac $(MAC_ARCHS) --publish=never

dev: ## Start the development server for interactive development
dev:
	@$(log) "Starting dev server..."
	@$(bin)/concurrently "make client.dev" "sleep 3 && make start"

TSC_FLAGS =

typecheck: ## Check for type errors
typecheck:
	@$(log) "Typechecking..."
	@$(bin)/tsc --noEmit $(TSC_FLAGS)

typecheck.watch: ## Check for type errors and recheck when a file changes
typecheck.watch: TSC_FLAGS = --watch
typecheck.watch: typecheck

format: ## Format all code
format:
	@$(bin)/biome check . --linter-enabled=false --write


formatting: ## Check the formatting of all code
formatting:
	@$(log) "Checking format..."
	@$(bin)/biome check . --linter-enabled=false $(SILENT)


lint: ## Check lint
lint:
	@$(log) "Linting..."
	@$(bin)/biome lint . $(SILENT)

# Production minify (the packaged app). `make start` overrides these so the
# unpackaged main process stays readable.
NODE_ENV ?= production
ESBUILD_FLAGS ?= --minify

index: # Build the "server"-side js
index: app/main.ts .env
	@$(log) "Building app js..."
	@mkdir -p dist
	@config="$$($(bin)/dotenv -p FIREBASE_CONFIG)"; \
		env NODE_ENV=$(NODE_ENV) $(bin)/esbuild --bundle --format=cjs --platform=node --external:electron --loader:.png=file app/main.ts --outfile=dist/index.cjs --define:FIREBASE_CONFIG="$${config:-null}" --define:process.env.NODE_ENV="\"$(NODE_ENV)\"" $(ESBUILD_FLAGS)

.env: # Recover the public Firebase config NTS ships in its own frontend bundle
.env:
	@$(log) "Fetching Firebase config from nts.live..."
	@node scripts/firebase-config.mjs > .env || (rm -f .env; \
		$(log) "Could not reach nts.live; building without the live tracklist"; \
		touch .env)

env: ## Refresh .env with the public Firebase config from nts.live
env:
	@rm -f .env
	@$(MAKE) --no-print-directory .env

preload: # Build the preload script
preload: dist/preload.js
dist/preload.js: app/preload.js
	@$(log) "Copying preload.js..."
	@mkdir -p dist
	@cp app/preload.js dist/preload.js

.PHONY: client
client: # Build the client-side code
client:
	@$(log) "Building client..."
	@mkdir -p dist
	@rm -rf dist/client/*
	@$(bin)/vite build

client.dev: # Start client-side development server
client.dev:
	@$(bin)/vite

packages: # Copy package.json and amend it for Electron
packages: dist/package.json
dist/package.json: package.json
	@$(log) "Copying package.json..."
	@mkdir -p dist
	@cat package.json | $(bin)/json -e 'this.dependencies=undefined' -e 'this.devDependencies=undefined' > dist/package.json

logos: ## Convert all svg logos into their png counterparts
logos: $(patsubst %.svg,%.png,$(wildcard logos/*.svg))

test: ## Run unit tests
test:
	@$(log) "Testing..."
	@node --test scripts/*.test.mjs

check: lint formatting typecheck test


# Git hooks
.PHONY: run-always

.git/hooks/%: run-always
	@echo "Creating $* hook"
	@echo "make -j4 git.$*" > ".git/hooks/$*"
	@chmod a+x ".git/hooks/$*"

.PHONY: hooks
hooks: .git/hooks/pre-commit .git/hooks/pre-push

git.pre-push: check
git.pre-commit: check
