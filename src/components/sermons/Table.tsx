import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)

import { useMemo } from 'react';
import {
  type MRT_ColumnDef,
  MRT_Table,
  useMantineReactTable,
} from 'mantine-react-table';
import { MantineProvider, useMantineTheme } from '@mantine/core';
import type { Sermon } from '~/types';
import moment from 'moment';

interface TableProps {
  sermons: Sermon[];
}

export const Table = ({sermons}: TableProps) => {
  const parentTheme = useMantineTheme();
  const data = useMemo(() => sermons, []);
  const columns = useMemo<MRT_ColumnDef<Sermon>[]>(
    () => [
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Title',
        Cell: ({ row }) => (
          <a class="inline-block hover:text-primary dark:hover:text-primary transition ease-in duration-200" href={`/sermons/${row.original.id}`}>{row.original.title}</a>
        ),
      },
      {
        id: 'passage',
        accessorKey: 'bibleText',
        header: 'Passage',
        minSize: 10,
        size: 10,
      },
      {
        id: "preachdate",
        accessorFn: (sermon: Sermon) => `${moment(sermon.preachDate).format('MMM D, YYYY')}`,
        header: 'Date',
        minSize: 10,
        size: 10,
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
      },
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    
    mantineTableProps: {
      className: 'table',
      highlightOnHover: true,
      striped: 'odd',
      withColumnBorders: true,
      withRowBorders: true,
      withTableBorder: true,
    },
    mantineTableHeadCellProps: { className: 'head-cells' },
    mantineTableBodyCellProps: { className: 'body-cells' },
  });

  // using MRT_Table instead of MantineReactTable if we do not want any of the toolbar features
  return (
    <MantineProvider theme={{ ...parentTheme, fontFamily: 'Inter Variable', fontSizes: { "xl": "xl" } }}>
      <MRT_Table table={table} />
    </MantineProvider>
  );
};

export default Table;
