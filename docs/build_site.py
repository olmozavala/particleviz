#!/usr/bin/env python3
"""Build the ParticleViz docs site into _site/ without a full Jekyll install."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

import markdown
from jinja2 import Environment, FileSystemLoader, select_autoescape
from markdown.extensions.toc import TocExtension

DOCS_DIR = Path(__file__).resolve().parent
REPO_ROOT = DOCS_DIR.parent
DEFAULT_BASEURL = "/particleviz/"
SITE_URL = "https://olmozavala.github.io"
TITLE = "ParticleViz"
DESCRIPTION = "Visualizing Lagrangian model outputs the easy way."

GENERATED_HTML = (
    "index.html",
    "install.html",
    "quick-start.html",
    "examples.html",
    "configuration.html",
    "dev_docs.html",
    "deployment.html",
    "intro-video.html",
    "404.html",
)


def relative_url(path: str, baseurl: str) -> str:
    """Mirror Jekyll's relative_url filter for baseurl-prefixed paths."""
    normalized = path if path.startswith("/") else f"/{path}"
    if not baseurl or baseurl == "/":
        return normalized
    return f"{baseurl.rstrip('/')}{normalized}"


def parse_front_matter(text: str) -> tuple[dict[str, str], str]:
    """Split YAML front matter from page body."""
    if not text.startswith("---"):
        return {}, text
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not match:
        return {}, text
    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    return meta, text[match.end() :]


def load_navigation() -> dict[str, list[dict[str, str]]]:
    """Load navigation entries from _data/navigation.yml."""
    nav_path = DOCS_DIR / "_data" / "navigation.yml"
    sections: dict[str, list[dict[str, str]]] = {"main": [], "actions": []}
    current = "main"
    for raw_line in nav_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.endswith(":"):
            current = line[:-1]
            sections.setdefault(current, [])
            continue
        if line.startswith("- title:"):
            sections[current].append({"title": line.split(":", 1)[1].strip().strip('"')})
        elif line.startswith("url:"):
            sections[current][-1]["url"] = line.split(":", 1)[1].strip().strip('"')
        elif line.startswith("style:"):
            sections[current][-1]["style"] = line.split(":", 1)[1].strip()
    return sections


def nav_url(url: str, baseurl: str) -> str:
    """Build a navigation href, prefixing internal paths with the site baseurl."""
    if url.startswith("#") or url.startswith("http"):
        return url
    return relative_url(url, baseurl)


def render_markdown(body: str, env: Environment, baseurl: str) -> tuple[str, str]:
    """Render Jinja placeholders in markdown, then convert to HTML and a TOC."""
    rendered = env.from_string(convert_liquid_filters(body)).render(
        relative_url=lambda path: relative_url(path, baseurl)
    )
    md = markdown.Markdown(
        extensions=[
            TocExtension(anchorlink=False, permalink=False, toc_depth=3),
            "tables",
            "fenced_code",
            "sane_lists",
            "attr_list",
        ],
        output_format="html5",
    )
    content_html = md.convert(rendered)
    toc_html = md.toc
    md.reset()
    return content_html, toc_html


def seo_tags(page_title: str, page_path: str = "/", baseurl: str = DEFAULT_BASEURL) -> str:
    """Generate basic SEO meta tags."""
    full_title = page_title if page_title else TITLE
    if page_title and page_title != TITLE:
        full_title = f"{page_title} | {TITLE}"
    prefix = "" if baseurl == "/" else baseurl.rstrip("/")
    canonical = f"{SITE_URL}{prefix}{page_path}"
    return (
        f"<title>{full_title}</title>\n"
        f'<meta name="description" content="{DESCRIPTION}" />\n'
        f'<link rel="canonical" href="{canonical}" />\n'
        f'<meta property="og:title" content="{full_title}" />\n'
        f'<meta property="og:description" content="{DESCRIPTION}" />\n'
        f'<meta property="og:url" content="{canonical}" />'
    )


def copy_tree(src: Path, dest: Path) -> None:
    """Copy a directory tree, replacing the destination if it exists."""
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def strip_jekyll_front_matter(text: str) -> str:
    """Remove leading Jekyll YAML front matter from a text file."""
    if not text.startswith("---"):
        return text
    match = re.match(r"^---\s*\n.*?\n---\s*\n", text, re.DOTALL)
    if match:
        return text[match.end() :]
    # Collapsed front matter on one line (e.g. broken CSS export).
    if text.startswith("--- ---"):
        return text.split("---", 2)[-1].lstrip()
    return text


def copy_static_assets(output_dir: Path) -> None:
    """Refresh compiled assets in the published docs folder."""
    assets_src = DOCS_DIR / "assets"
    assets_dest = output_dir / "assets"
    assets_dest.mkdir(parents=True, exist_ok=True)
    for path in assets_src.rglob("*"):
        if path.is_file():
            rel = path.relative_to(assets_src)
            target = assets_dest / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            if path.suffix in {".css", ".scss"}:
                if path.suffix == ".scss" and path.with_suffix(".css").exists():
                    continue
                cleaned = strip_jekyll_front_matter(path.read_text(encoding="utf-8"))
                out = target.with_suffix(".css") if path.suffix == ".scss" else target
                if path.resolve() != out.resolve() or path.suffix == ".scss":
                    out.write_text(cleaned, encoding="utf-8")
            else:
                if path.resolve() != target.resolve():
                    shutil.copy2(path, target)


def convert_liquid_filters(text: str) -> str:
    """Convert Jekyll liquid filter syntax to Jinja function calls."""
    text = re.sub(
        r"\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}",
        r"{{ relative_url('\1') }}",
        text,
    )
    return text


def prepare_layout(env: Environment, baseurl: str) -> object:
    """Load and adapt the default layout template for Jinja rendering."""
    layout_src = (DOCS_DIR / "_layouts" / "default.html").read_text(encoding="utf-8")
    head_custom = (DOCS_DIR / "_includes" / "head-custom.html").read_text(encoding="utf-8")
    head_custom = env.from_string(convert_liquid_filters(head_custom)).render(
        relative_url=lambda path: relative_url(path, baseurl)
    )

    layout_src = convert_liquid_filters(layout_src)
    layout_src = layout_src.replace("{% seo %}", "{{ seo | safe }}")
    layout_src = layout_src.replace("{% include head-custom.html %}", head_custom)
    layout_src = layout_src.replace(
        "{% for item in site.data.navigation.main %}",
        "{% for item in navigation.main %}",
    )
    layout_src = layout_src.replace(
        "<li><a href=\"{{ item.url | nav_url }}\">{{ item.title }}</a></li>",
        '<li><a href="{{ item.url | nav_url }}"{% if page.url == item.url %} class="is-active" aria-current="page"{% endif %}>{{ item.title }}</a></li>',
    )
    layout_src = layout_src.replace(
        "{% for item in site.data.navigation.actions %}",
        "{% for item in navigation.actions %}",
    )
    layout_src = layout_src.replace(
        "{{ site.lang | default: 'en-US' }}",
        "{{ site.lang }}",
    )
    layout_src = layout_src.replace(
        "{{ site.description | default: site.github.project_tagline }}",
        "{{ site.description }}",
    )
    layout_src = layout_src.replace(
        "{% if item.url contains 'http' %}",
        "{% if 'http' in item.url %}",
    )
    layout_src = layout_src.replace(
        "{% unless page.toc %} page-layout--no-sidebar{% endunless %}",
        "{% if not page.toc %} page-layout--no-sidebar{% endif %}",
    )
    layout_src = layout_src.replace("{{ page.toc }}", "{{ page.toc | safe }}")
    layout_src = layout_src.replace("{{ content }}", "{{ content | safe }}")
    return env.from_string(layout_src)


def build_page(
    source: Path,
    output: Path,
    layout_template: object,
    env: Environment,
    navigation: dict[str, list[dict[str, str]]],
    baseurl: str,
) -> None:
    """Build a single HTML page from markdown or HTML source."""
    raw = source.read_text(encoding="utf-8")
    meta, body = parse_front_matter(raw)
    page_title = meta.get("title", "")

    toc_html = ""
    if source.suffix == ".md":
        content_html, toc_html = render_markdown(body, env, baseurl)
    else:
        content_html = env.from_string(convert_liquid_filters(body)).render(
            relative_url=lambda path: relative_url(path, baseurl)
        )

    page_path = "/" if output.name == "index.html" else f"/{output.name}"

    html = layout_template.render(
        site={
            "title": TITLE,
            "description": DESCRIPTION,
            "lang": "en-US",
            "baseurl": baseurl,
            "url": SITE_URL,
        },
        page={"title": page_title, "toc": toc_html, "url": page_path},
        content=content_html,
        navigation=navigation,
        seo=seo_tags(page_title, page_path, baseurl),
        relative_url=lambda path: relative_url(path, baseurl),
        nav_url=lambda url: nav_url(url, baseurl),
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")


def main() -> None:
    """Build documentation pages into docs/ for GitHub Pages."""
    import argparse

    parser = argparse.ArgumentParser(description="Build ParticleViz docs into docs/")
    parser.add_argument(
        "--local",
        action="store_true",
        help="Use baseurl / for local preview (python -m http.server --directory docs)",
    )
    args = parser.parse_args()
    baseurl = "/" if args.local else DEFAULT_BASEURL

    output_dir = DOCS_DIR
    (output_dir / ".nojekyll").touch()

    navigation = load_navigation()
    env = Environment(
        loader=FileSystemLoader(str(DOCS_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    env.filters["relative_url"] = lambda path: relative_url(path, baseurl)
    env.filters["nav_url"] = lambda url: nav_url(url, baseurl)
    env.globals["relative_url"] = lambda path: relative_url(path, baseurl)

    layout_template = prepare_layout(env, baseurl)
    pages = [
        (DOCS_DIR / "index.md", output_dir / "index.html"),
        (DOCS_DIR / "install.md", output_dir / "install.html"),
        (DOCS_DIR / "quick-start.md", output_dir / "quick-start.html"),
        (DOCS_DIR / "examples.md", output_dir / "examples.html"),
        (DOCS_DIR / "configuration.md", output_dir / "configuration.html"),
        (DOCS_DIR / "dev_docs.md", output_dir / "dev_docs.html"),
        (DOCS_DIR / "deployment.md", output_dir / "deployment.html"),
        (DOCS_DIR / "intro-video.md", output_dir / "intro-video.html"),
        (DOCS_DIR / "404.md", output_dir / "404.html"),
    ]

    for source, output in pages:
        build_page(source, output, layout_template, env, navigation, baseurl)

    copy_static_assets(output_dir)
    print(f"Built site in {output_dir}")
    if args.local:
        print("Local preview: python -m http.server 4000 --directory docs")
        print("Open http://localhost:4000/")
    else:
        print("GitHub Actions deploys on push to main (see .github/workflows/docs.yml)")
        print("Live site: https://olmozavala.github.io/particleviz/")


if __name__ == "__main__":
    main()
