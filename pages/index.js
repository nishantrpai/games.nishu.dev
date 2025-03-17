import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { useState, useEffect, useMemo } from 'react'
import { FiSearch } from 'react-icons/fi'
import { useRouter } from 'next/router'
import MiniSearch from 'minisearch'


export const tools = [
  {
    title: 'Matchpepe',
    description: 'A simple and fun matching parts of opepen',
    publishDate: '17th Mar 2025',
    url: '/matchpepe',
    tags: ['opepen'],
  }
]

export default function Home() {
  const router = useRouter();
  const { tags } = router.query;
  const [search, setSearch] = useState('');
  const [filteredTools, setFilteredTools] = useState(tools);
  const [isSearching, setIsSearching] = useState(false);

  // Create and configure MiniSearch instance
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch({
      fields: ['title', 'description'], 
      storeFields: ['title', 'description', 'publishDate', 'icon', 'url', 'tags'], 
      searchOptions: {
        boost: { title: 2, description: 2 }, 
        fuzzy: 0.3,
        prefix: true
      },
    });

    ms.addAll(tools.map((tool, id) => ({ ...tool, id })));
    
    return ms;
  }, []);

  useEffect(() => {
    const tagArray = tags ? tags.split(',') : [];
    setIsSearching(true);

    // Debounce for performance
    const timer = setTimeout(() => {
      // If search is empty, just show all tools filtered by tags
      if (!search.trim()) {
        setFilteredTools(tools.filter(tool => 
          tagArray.length === 0 || tagArray.some(tag => tool.tags.includes(tag))
        ).reverse());
        setIsSearching(false);
        return;
      }

      // Extract quoted phrases from the search query
      const quoteRegex = /"([^"]*)"/g;
      const quotedPhrases = [];
      let match;
      while ((match = quoteRegex.exec(search)) !== null) {
        quotedPhrases.push(match[1].toLowerCase());
      }

      // Create a clean search term without the quotes
      const cleanSearch = search.replace(/"([^"]*)"/g, '$1');
      
      // Perform search with MiniSearch
      const results = miniSearch.search(cleanSearch);
      
      // Add regular keyword search results for the best coverage
      const keywordResults = tools.filter(tool => 
        (tool.title.toLowerCase().includes(cleanSearch.toLowerCase()) || 
         tool.description.toLowerCase().includes(cleanSearch.toLowerCase())) &&
        (tagArray.length === 0 || tagArray.some(tag => tool.tags.includes(tag)))
      );

      // Merge results, removing duplicates by URL
      const mergedResults = [...keywordResults];
      results.forEach(result => {
        if (!mergedResults.find(item => item.url === result.url)) {
          mergedResults.push(tools.find(tool => tool.url === result.url));
        }
      });

      // Apply tag filtering to the merged results
      let filteredResults = mergedResults.filter(tool => 
        tagArray.length === 0 || tagArray.some(tag => tool.tags.includes(tag))
      );

      // Add priority scores for quoted phrase exact matches
      if (quotedPhrases.length > 0) {
        filteredResults = filteredResults.map(tool => {
          const titleLower = tool.title.toLowerCase();
          const descLower = tool.description.toLowerCase();
          
          // Calculate priority score based on exact matches of quoted phrases
          let priorityScore = 0;
          quotedPhrases.forEach(phrase => {
            // Exact match in title is highest priority
            if (titleLower.includes(phrase)) {
              priorityScore += 100;
            }
            // Exact match in description is high priority
            if (descLower.includes(phrase)) {
              priorityScore += 50;
            }
          });

          return { ...tool, priorityScore };
        });

        // Sort by priority score first (higher scores first), then by original order
        filteredResults.sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) {
            return b.priorityScore - a.priorityScore;
          }
          return tools.indexOf(a) - tools.indexOf(b);
        });
      }
      
      setFilteredTools(filteredResults);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, tags, miniSearch]);

  return (
    <>
      <Head>
        <title>Games by Nishu</title>
        <meta name="description" content="Games by Nishu" />
        <meta name="keywords" content="games, nishu, pai nishant, pai nishu" />
        <meta name="author" content="Nishant Pai" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="theme-color" content="#000000" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@PaiNishant" />
        <meta name="twitter:creator" content="@PaiNishant" />
        <meta property="og:url" content="https://games.nishu.dev" />
        <meta property="og:title" content="Games by Nishu" />
        <meta property="og:description" content="Games by Nishu" />
        <meta property="og:image" content="https://games.nishu.dev/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="Games by Nishu" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

      </Head>
      <main className={styles.main}>
        <a href='https://twitter.com/PaiNishant' style={{
          top: '10px',
          right: '10px',
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '10px',
        }}
          target='_blank'
        >
          @PaiNishant
        </a>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input 
            className={styles.search} 
            onChange={(e) => {
              setSearch(e.target.value)
            }} 
            placeholder='Search for games for example "Matchpepe"' 
          />
          {isSearching && (
            <span className={styles.searchStatus}>Searching...</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '20px', marginBottom: 30 }}>
          {filteredTools.map((tool, index) => (
            <a key={index} href={tool.url}>
              <p style={{
                fontSize: '1rem',
                color: '#eee',
                marginBottom: '10px',
              }}>{filteredTools.length - (index)}. {tool.title}</p>
              <p style={{
                fontSize: '0.8rem',
                display: 'flex',
                color: '#888',
                marginBottom: '10px',
              }}>{tool.description}</p>
              <span className={styles.date}>{tool.publishDate}</span>
            </a>
          ))}
        </div>
      </main>
    </>
  )
}
