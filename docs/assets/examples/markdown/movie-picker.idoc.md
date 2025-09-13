```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "selectedGenre",
      "value": ""
    },
    {
      "name": "filteredByGenre",
      "update": "data('filteredByGenre')"
    },
    {
      "name": "selectedCreativeType",
      "value": ""
    },
    {
      "name": "selectedMpaaRating",
      "value": ""
    },
    {
      "name": "selected_Major_Genre",
      "value": "All Movies",
      "update": "selectedGenre && selectedGenre !== 'null' && selectedGenre !== '' ? selectedGenre + ' Movies' : 'All Movies'"
    },
    {
      "name": "filteredByCreativeType",
      "update": "data('filteredByCreativeType')"
    },
    {
      "name": "selected_Creative_Type",
      "value": "All Creative Types",
      "update": "selectedCreativeType && selectedCreativeType !== 'null' && selectedCreativeType !== '' ? selectedCreativeType + ' Movies' : 'All Creative Types'"
    },
    {
      "name": "selected_MPAA_Rating",
      "value": "All Ratings",
      "update": "selectedMpaaRating && selectedMpaaRating !== 'null' && selectedMpaaRating !== '' ? selectedMpaaRating + ' Movies' : 'All Ratings'"
    },
    {
      "name": "filteredByMpaaRating",
      "update": "data('filteredByMpaaRating')"
    },
    {
      "name": "moviesData",
      "update": "data('moviesData')"
    }
  ],
  "data": [
    {
      "name": "moviesData",
      "url": "https://vega.github.io/editor/data/movies.json",
      "format": {
        "type": "json"
      }
    },
    {
      "name": "filteredByGenre",
      "source": [
        "moviesData"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "!selectedGenre || selectedGenre === '' || selectedGenre === 'null' || datum['Major Genre'] === selectedGenre"
        }
      ]
    },
    {
      "name": "filteredByCreativeType",
      "source": [
        "filteredByGenre"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "!selectedCreativeType || selectedCreativeType === '' || selectedCreativeType === 'null' || datum['Creative Type'] === selectedCreativeType"
        }
      ]
    },
    {
      "name": "filteredByMpaaRating",
      "source": [
        "filteredByCreativeType"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "!selectedMpaaRating || selectedMpaaRating === '' || selectedMpaaRating === 'null' || datum['MPAA Rating'] === selectedMpaaRating"
        }
      ]
    }
  ]
}
```


```css
html, body { height: 100%; margin: 0; padding: 0; scroll-behavior: smooth; overflow-y: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
body { scroll-snap-type: y mandatory; }
.group { scroll-snap-align: start; min-height: 100vh; margin: 0; padding: 3em 2em; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; overflow: hidden; text-align: center; }
#intro { background: linear-gradient(135deg, #2c3e50 0%, #8b0000 100%); color: white; }
#genreFilter { background: linear-gradient(135deg, #8b0000 0%, #4b0082 100%); color: white; }
#creativeTypeFilter { background: linear-gradient(135deg, #4b0082 0%, #2c3e50 100%); color: white; }
#mpaaRatingFilter { background: linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%); color: white; }
#results { background: linear-gradient(135deg, #1a1a2e 0%, #8b0000 100%); color: white; text-align: left; }
h1 { font-size: 3em; margin: 0.3em 0; font-weight: 300; line-height: 1.2; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
h2 { font-size: 2.2em; margin: 0.4em 0; font-weight: 300; line-height: 1.2; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }
h3 { font-size: 1.8em; margin: 0.5em 0; font-weight: 400; line-height: 1.2; }
p, label { font-size: 1.3em; line-height: 1.5; margin: 1em 0; }
.dropdown-container { margin: 2em 0; }
select { padding: 12px 20px; font-size: 1.1em; border-radius: 8px; border: none; background: rgba(255,255,255,0.9); color: #333; min-width: 250px; }
.tabulator { background: linear-gradient(135deg, #1a1a2e 0%, #2c3e50 100%); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); border: 2px solid rgba(139,0,0,0.3); overflow: hidden; }
.tabulator-header { background: linear-gradient(135deg, #8b0000 0%, #4b0082 100%); color: white; border-bottom: 2px solid rgba(255,255,255,0.1); }
.tabulator-col { color: white; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.7); border-right: 1px solid rgba(255,255,255,0.1); padding: 12px 8px; }
.tabulator-col:last-child { border-right: none; }
.tabulator-row { background: rgba(26,26,46,0.8); border-bottom: 1px solid rgba(139,0,0,0.2); transition: all 0.3s ease; }
.tabulator-row:nth-child(even) { background: rgba(44,62,80,0.6); }
.tabulator-row:hover { background: linear-gradient(135deg, rgba(139,0,0,0.4) 0%, rgba(75,0,130,0.4) 100%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139,0,0,0.3); }
.tabulator-cell { color: white; padding: 12px 8px; border-right: 1px solid rgba(255,255,255,0.05); font-size: 0.95em; }
.tabulator-cell:last-child { border-right: none; }
.tabulator-footer { background: linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%); color: white; border-top: 2px solid rgba(139,0,0,0.3); padding: 12px; }
.tabulator-paginator { color: white; }
.tabulator-page { background: rgba(139,0,0,0.7); color: white; border: 1px solid rgba(255,255,255,0.2); margin: 0 2px; padding: 6px 12px; border-radius: 4px; transition: all 0.3s ease; }
.tabulator-page:hover { background: rgba(139,0,0,0.9); transform: translateY(-1px); box-shadow: 0 2px 6px rgba(139,0,0,0.4); }
.tabulator-page.active { background: linear-gradient(135deg, #8b0000 0%, #4b0082 100%); color: white; font-weight: bold; }
.results-header { background: rgba(139,0,0,0.8); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
@media (max-width: 768px) { .group { padding: 2em 1em; } h1 { font-size: 2.2em; } h2 { font-size: 1.8em; } h3 { font-size: 1.4em; } p, label { font-size: 1.1em; } select { min-width: 200px; } }
@media (max-width: 480px) { .group { padding: 1.5em 0.8em; } h1 { font-size: 1.8em; } h2 { font-size: 1.5em; } h3 { font-size: 1.2em; } p, label { font-size: 1em; } select { min-width: 180px; font-size: 1em; } }
```


::: group {#intro}

# 🎬 Movie Wizard
## Progressive Movie Explorer
### Discover your perfect movie through guided filtering

**Step through each screen to narrow down your movie selection**

🎭 *Welcome to the cinema experience*
:::
::: group {#genreFilter}

# 🎯 Step 1: Choose Your Genre
## What kind of story calls to you tonight?


```yaml dropdown
variableId: selectedGenre
value: ''
dynamicOptions:
  dataSourceName: moviesData
  fieldName: Major Genre
```


### {{selected_Major_Genre}}

**Scroll down to continue your journey →**
:::
::: group {#creativeTypeFilter}

# 🎨 Step 2: Creative Style
## How do you want your story told?


```yaml dropdown
variableId: selectedCreativeType
value: ''
dynamicOptions:
  dataSourceName: filteredByGenre
  fieldName: Creative Type
```


### {{selected_Creative_Type}}

**One more step to your perfect movie →**
:::
::: group {#mpaaRatingFilter}

# 🎟️ Step 3: Rating Preference
## What's appropriate for your audience?


```yaml dropdown
variableId: selectedMpaaRating
value: ''
dynamicOptions:
  dataSourceName: filteredByCreativeType
  fieldName: MPAA Rating
```


### {{selected_MPAA_Rating}}

**Ready to see your curated selection? →**
:::
::: group {#results}

# 🍿 Your Movie Selection

### {{selected_Major_Genre}} • {{selected_Creative_Type}} • {{selected_MPAA_Rating}}


```json tabulator
{
  "dataSourceName": "filteredByMpaaRating",
  "tabulatorOptions": {
    "layout": "fitColumns",
    "minHeight": "500px",
    "maxHeight": "500px",
    "pagination": "local",
    "paginationSize": 15,
    "columns": [
      {
        "title": "Title",
        "field": "Title",
        "width": 200
      },
      {
        "title": "Director",
        "field": "Director",
        "width": 150
      },
      {
        "title": "Release Date",
        "field": "Release Date",
        "width": 120
      },
      {
        "title": "Running Time",
        "field": "Running Time min",
        "width": 110
      },
      {
        "title": "IMDB Rating",
        "field": "IMDB Rating",
        "width": 100
      },
      {
        "title": "US Gross",
        "field": "US Gross",
        "formatter": "money",
        "width": 120
      },
      {
        "title": "Worldwide Gross",
        "field": "Worldwide Gross",
        "formatter": "money",
        "width": 140
      }
    ]
  }
}
```


### 🎬 *Enjoy your movie night!*
:::