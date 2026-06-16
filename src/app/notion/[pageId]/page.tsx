import { notion } from '@/lib/notion';
import { NotionPageRenderer } from '@/components/NotionPageRenderer';

export default async function NotionPage({ params }: { params: { pageId: string } }) {
  try {
    const { pageId } = params;
    // Fetch the Notion page data (recordMap) from Notion's unofficial API
    const recordMap = await notion.getPage(pageId);

    return (
      <div className="flex-1 w-full h-screen overflow-y-auto bg-background text-foreground">
        <NotionPageRenderer recordMap={recordMap} darkMode={true} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching Notion page:', error);
    return (
      <div className="flex-1 w-full flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Failed to load Notion Page</h1>
          <p className="text-muted-foreground">Please check if the Page ID is valid and the page is public.</p>
        </div>
      </div>
    );
  }
}
