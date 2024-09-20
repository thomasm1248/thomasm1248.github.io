---
selectedTab: tags
title: Tags
layout: page
---

{% for tag in site.tags %}
## {{ tag[0] }}

{% for post in tag[1] %}
- [{{ post.title }}]({% if post.link %}{{ post.link }}{% else %}{{ post.url }}{% endif %}) ({{ post.categories[0] }})

  {{ post.excerpt }}
{% endfor %}
{% endfor %}

## Untagged

{% for post in site.posts %}
{% if post.tags == empty %}
- [{{ post.title }}]({% if post.link %}{{ post.link }}{% else %}{{ post.url }}{% endif %}) ({{ post.categories[0] }})

  {{ post.excerpt }}
{% endif %}
{% endfor %}
