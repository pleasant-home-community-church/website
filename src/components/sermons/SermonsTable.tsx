import { Table } from './Table';
import type { Sermon } from '~/types';
import { MantineProvider } from '@mantine/core';

interface SermonTableProps {
  sermons: Sermon[];
}

export const SermonsTable = ({sermons}: SermonTableProps) => {
  return (
    // <MantineProvider theme={{ ...parentTheme, primaryColor: 'pink' }}>
    <MantineProvider>
      <Table sermons={sermons} />
    </MantineProvider>
  );
};

export default SermonsTable;
