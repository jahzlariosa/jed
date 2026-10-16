import {
  USERS_DIRECTORY_PAGE_SIZES,
  usersDirectoryRowRange,
  type UsersDirectoryPageSize,
} from '#/auth/users-directory-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function AdminDirectoryPagination({
  page,
  pageSize,
  pageCount,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: UsersDirectoryPageSize) => void
}) {
  const { from, to } = usersDirectoryRowRange(page, pageSize, total)

  return (
    <div className="admin-directory-pagination">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="admin-directory-pagination-controls">
        <div className="flex items-center gap-2">
          <Label htmlFor="directory-page-size" className="text-xs">
            Per page
          </Label>
          <select
            id="directory-page-size"
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(
                Number.parseInt(
                  event.target.value,
                  10,
                ) as UsersDirectoryPageSize,
              )
            }
          >
            {USERS_DIRECTORY_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
