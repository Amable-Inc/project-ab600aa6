'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, GripVertical } from 'lucide-react';

type Book = {
  id: string;
  title: string;
  author: string;
  cover?: string;
  rating?: number;
  section: 'reading' | 'wantToRead' | 'alreadyRead';
};

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualBook, setManualBook] = useState({ title: '', author: '', cover: '' });

  // Load books from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bookRankings');
    if (saved) {
      setBooks(JSON.parse(saved));
    }
  }, []);

  // Save books to localStorage
  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem('bookRankings', JSON.stringify(books));
    }
  }, [books]);

  const searchBooks = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
      );
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const addBookFromSearch = (item: any, section: Book['section']) => {
    const book: Book = {
      id: item.id + Date.now(),
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors?.[0] || 'Unknown Author',
      cover: item.volumeInfo.imageLinks?.thumbnail,
      section,
    };
    setBooks([...books, book]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addManualBook = (section: Book['section']) => {
    if (!manualBook.title.trim()) return;
    const book: Book = {
      id: Date.now().toString(),
      title: manualBook.title,
      author: manualBook.author || 'Unknown Author',
      cover: manualBook.cover || undefined,
      section,
    };
    setBooks([...books, book]);
    setManualBook({ title: '', author: '', cover: '' });
    setShowManualAdd(false);
  };

  const updateRating = (id: string, rating: number) => {
    setBooks(books.map(book => book.id === id ? { ...book, rating } : book));
  };

  const moveBook = (id: string, newSection: Book['section']) => {
    setBooks(books.map(book => book.id === id ? { ...book, section: newSection } : book));
  };

  const deleteBook = (id: string) => {
    setBooks(books.filter(book => book.id !== id));
  };

  const BookCard = ({ book }: { book: Book }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow">
      {book.cover && (
        <img src={book.cover} alt={book.title} className="w-16 h-24 object-cover rounded" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
        <p className="text-sm text-gray-600 truncate">{book.author}</p>
        
        {book.section === 'alreadyRead' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              value={book.rating || 5}
              onChange={(e) => updateRating(book.id, parseInt(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="1"
              max="10"
              value={book.rating || 5}
              onChange={(e) => updateRating(book.id, Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
            />
            <span className="text-sm font-medium text-gray-700">/10</span>
          </div>
        )}

        <div className="mt-2 flex gap-2">
          {book.section !== 'reading' && (
            <button
              onClick={() => moveBook(book.id, 'reading')}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Reading
            </button>
          )}
          {book.section !== 'wantToRead' && (
            <button
              onClick={() => moveBook(book.id, 'wantToRead')}
              className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Want to Read
            </button>
          )}
          {book.section !== 'alreadyRead' && (
            <button
              onClick={() => moveBook(book.id, 'alreadyRead')}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Finished
            </button>
          )}
          <button
            onClick={() => deleteBook(book.id)}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 ml-auto"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );

  const Section = ({ title, section, books }: { title: string; section: Book['section']; books: Book[] }) => {
    const sectionBooks = section === 'alreadyRead' 
      ? books.filter(b => b.section === section).sort((a, b) => (b.rating || 0) - (a.rating || 0))
      : books.filter(b => b.section === section);

    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-3">
          {sectionBooks.length === 0 ? (
            <p className="text-gray-500 text-sm">No books yet</p>
          ) : (
            sectionBooks.map(book => <BookCard key={book.id} book={book} />)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">My Book Rankings</h1>
          <p className="text-gray-600 text-lg">Sharing my honest opinions, one book at a time</p>
        </header>

        {/* Search & Add */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchBooks(searchQuery)}
              placeholder="Search for a book..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => searchBooks(searchQuery)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Search size={20} />
              Search
            </button>
            <button
              onClick={() => setShowManualAdd(!showManualAdd)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Manual
            </button>
          </div>

          {/* Manual Add Form */}
          {showManualAdd && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Add Book Manually</h3>
              <div className="grid gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Book Title"
                  value={manualBook.title}
                  onChange={(e) => setManualBook({ ...manualBook, title: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={manualBook.author}
                  onChange={(e) => setManualBook({ ...manualBook, author: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Cover Image URL (optional)"
                  value={manualBook.cover}
                  onChange={(e) => setManualBook({ ...manualBook, cover: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => addManualBook('reading')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add to Reading</button>
                <button onClick={() => addManualBook('wantToRead')} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Add to Want to Read</button>
                <button onClick={() => addManualBook('alreadyRead')} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Add to Already Read</button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Search Results - Add to:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50">
                    {item.volumeInfo.imageLinks?.thumbnail && (
                      <img src={item.volumeInfo.imageLinks.thumbnail} alt="" className="w-12 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.volumeInfo.title}</p>
                      <p className="text-sm text-gray-600 truncate">{item.volumeInfo.authors?.[0]}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addBookFromSearch(item, 'reading')} className="px-3 py-1 text-xs bg-blue-500 text-white rounded">Reading</button>
                      <button onClick={() => addBookFromSearch(item, 'wantToRead')} className="px-3 py-1 text-xs bg-yellow-500 text-white rounded">Want</button>
                      <button onClick={() => addBookFromSearch(item, 'alreadyRead')} className="px-3 py-1 text-xs bg-green-500 text-white rounded">Read</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Book Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          <Section title="📚 Currently Reading" section="reading" books={books} />
          <Section title="📖 Want to Read" section="wantToRead" books={books} />
          <Section title="✅ Already Read" section="alreadyRead" books={books} />
        </div>
      </div>
    </div>
  );
}
