import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react'
import {
  useImportInventory,
  type ImportInventoryResult,
} from '../hooks/useImportInventory'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const EXPECTED_COLUMNS = [
  'producto_nombre',
  'producto_marca',
  'producto_categoria',
  'producto_descripcion',
  'variante_nombre',
  'sku',
  'precio_venta',
  'stock_actual',
  'stock_minimo',
  'fecha_caducidad',
  'imagen_url',
]

export function ImportInventoryModal({ isOpen, onClose }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportInventoryResult | null>(null)
  const [localError, setLocalError] = useState('')

  const { mutate: importInventory, isPending } = useImportInventory()

  if (!isOpen) return null

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    setSelectedFile(file)
    setResult(null)
    setLocalError('')
  }

  function handleImport() {
    if (!selectedFile) {
      setLocalError('Selecciona un archivo CSV o Excel.')
      return
    }

    setLocalError('')
    setResult(null)

    importInventory(selectedFile, {
      onSuccess: (data) => {
        setResult(data)
      },

      onError: (error) => {
        setLocalError(
          error instanceof Error
            ? error.message
            : 'No se pudo importar el inventario.'
        )
      },
    })
  }

  function handleDownloadTemplate() {
    const rows = [
      EXPECTED_COLUMNS,
      [
        'Labial Velvet',
        'Beauty Glow',
        'Labiales',
        'Labial acabado mate',
        'Rojo Carmín',
        'LAB-VEL-ROJO',
        '149.90',
        '20',
        '5',
        '2027-12-31',
        '',
      ],
      [
        'Labial Velvet',
        'Beauty Glow',
        'Labiales',
        'Labial acabado mate',
        'Rosa Nude',
        'LAB-VEL-ROSA',
        '149.90',
        '15',
        '5',
        '2027-12-31',
        '',
      ],
    ]

    const csv = `\uFEFF${rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
      )
      .join('\n')}`

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'plantilla-inventario-stockglow.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  function handleClose() {
    if (isPending) return

    setSelectedFile(null)
    setResult(null)
    setLocalError('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-inventory-title"
    >
      <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white px-6 py-7 shadow-2xl sm:px-10 sm:py-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="import-inventory-title"
              className="text-2xl font-extrabold text-[#2D2A32]"
            >
              Importar inventario
            </h2>

            <p className="mt-2 text-sm text-[#7A7480]">
              Carga productos y variantes desde un archivo CSV o Excel.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 rounded-2xl border border-pink-100 bg-pink-50/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-[#2D2A32]">Formato esperado</h3>

              <p className="mt-1 text-sm text-[#7A7480]">
                La primera fila debe contener estas columnas en este orden:
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E85D8C] bg-white px-4 text-sm font-bold text-[#E85D8C] transition hover:bg-[#FFF1F5]"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXPECTED_COLUMNS.map((column) => (
              <code
                key={column}
                className="rounded-lg border border-pink-100 bg-white px-2.5 py-1.5 text-xs text-[#C64270]"
              >
                {column}
              </code>
            ))}
          </div>

          <div className="mt-4 text-xs leading-5 text-[#7A7480]">
            Obligatorios: <strong>producto_nombre</strong>,{' '}
            <strong>variante_nombre</strong>, <strong>sku</strong> y{' '}
            <strong>precio_venta</strong>. La fecha debe usar el formato{' '}
            <strong>YYYY-MM-DD</strong>.
          </div>
        </div>

        <div className="mt-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#F1DDE5] bg-[#FFFAFB] px-6 py-10 text-center transition hover:border-[#E85D8C] hover:bg-[#FFF5F8]">
            <FileSpreadsheet className="h-10 w-10 text-[#E85D8C]" />

            <span className="mt-3 font-bold text-[#2D2A32]">
              Selecciona un archivo
            </span>

            <span className="mt-1 text-sm text-[#7A7480]">
              CSV, XLSX o XLS, máximo 5 MB
            </span>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isPending}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-green-800">
                  {selectedFile.name}
                </p>

                <p className="text-xs text-green-700">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}
        </div>

        {localError && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="font-bold text-red-700">
                No se pudo procesar el archivo
              </p>

              <p className="mt-1 text-sm text-red-600">{localError}</p>

              <p className="mt-2 text-xs text-red-600">
                Revisa que el archivo utilice exactamente las columnas mostradas
                en la sección “Formato esperado”.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-7 space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-[#2D2A32]">
                Resultado de la importación
              </h3>

              <p className="mt-1 text-sm text-[#7A7480]">
                Archivo procesado: {result.archivo}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <ResultCard label="Filas" value={result.totalFilas} />
              <ResultCard label="Importadas" value={result.filasImportadas} />
              <ResultCard label="Fallidas" value={result.filasFallidas} />
              <ResultCard label="Productos" value={result.productosCreados} />
              <ResultCard label="Variantes" value={result.variantesCreadas} />
            </div>

            {result.errores.length === 0 ? (
              <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />

                <p className="text-sm font-medium text-green-700">
                  Todas las filas fueron importadas correctamente.
                </p>
              </div>
            ) : (
              <div>
                <h4 className="font-bold text-[#2D2A32]">Filas con errores</h4>

                <p className="mt-1 text-sm text-[#7A7480]">
                  Las filas correctas fueron importadas. Revisa y corrige las
                  siguientes:
                </p>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-red-100">
                  <table className="min-w-full divide-y divide-red-100">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-red-700">
                          Fila
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-red-700">
                          Campo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-red-700">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-red-700">
                          Motivo
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-red-100 bg-white">
                      {result.errores.map((rowError, index) => (
                        <tr key={`${rowError.fila}-${rowError.campo}-${index}`}>
                          <td className="px-4 py-3 text-sm font-bold text-red-700">
                            {rowError.fila}
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs text-[#C64270]">
                              {rowError.campo}
                            </code>
                          </td>
                          <td className="max-w-48 truncate px-4 py-3 text-sm text-[#6F6875]">
                            {rowError.valor || 'Vacío'}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600">
                            {rowError.motivo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="h-12 min-w-32 rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9] disabled:opacity-50"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || isPending}
            className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isPending ? 'Procesando...' : 'Importar inventario'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#F1DDE5] bg-[#FFFAFB] p-4 text-center">
      <p className="text-2xl font-extrabold text-[#2D2A32]">{value}</p>

      <p className="mt-1 text-xs font-bold uppercase text-[#7A7480]">{label}</p>
    </div>
  )
}
