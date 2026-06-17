FROM python:3.12-bookworm-slim

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    nodejs \
    npm \
    libgeos-dev \
    libproj-dev \
    libnetcdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY ParticleViz_WebApp /app/ParticleViz_WebApp
COPY ParticleViz_DataPreproc /app/ParticleViz_DataPreproc
COPY ExampleData /app/ExampleData
COPY ConfigExamples /app/ConfigExamples
COPY --chmod=0755 entrypoint.sh /app/
COPY ParticleViz.py /app/

RUN cd ParticleViz_WebApp && npm install

EXPOSE 3000

CMD ["./entrypoint.sh"]
