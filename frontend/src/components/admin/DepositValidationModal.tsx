import { useState, useEffect } from 'react'
import { adminPaymentApi, AdminDepositRequest, ApproveDepositResponse, RejectDepositResponse } from '@/services/adminPaymentApi'
import { formatCurrency } from '@/utils/currency'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

interface DepositValidationModalProps {
  isOpen: boolean
  onClose: () => void
  deposit: AdminDepositRequest | null
  onApproved?: (result: ApproveDepositResponse) => void
  onRejected?: (result: RejectDepositResponse) => void
  className?: string
}

export const DepositValidationModal = ({
  isOpen,
  onClose,
  deposit,
  onApproved,
  onRejected,
  className = ''
}: DepositValidationModalProps) => {
  const { user } = useAuth()
  const [action, setAction] = useState<'review' | 'approve' | 'reject'>('review')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data for approval
  const [approvalData, setApprovalData] = useState({
    bankReference: '',
    adminNotes: '',
    proofImageUrl: ''
  })

  // Form data for rejection
  const [rejectionData, setRejectionData] = useState({
    reason: ''
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && deposit) {
      setAction('review')
      setError(null)
      setApprovalData({
        bankReference: '',
        adminNotes: '',
        proofImageUrl: ''
      })
      setRejectionData({
        reason: ''
      })
    }
  }, [isOpen, deposit])

  const handleApprove = async () => {
    if (!deposit) return

    if (!approvalData.bankReference.trim()) {
      setError('La referencia bancaria es obligatoria')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await adminPaymentApi.approveDeposit(deposit.id, {
        bankReference: approvalData.bankReference.trim(),
        adminNotes: approvalData.adminNotes.trim() || undefined,
        proofImageUrl: approvalData.proofImageUrl.trim() || undefined
      })

      if (onApproved) {
        onApproved(result)
      }

      onClose()
    } catch (err) {
      console.error('Error approving deposit:', err)
      setError(err instanceof Error ? err.message : 'Error aprobando depósito')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!deposit) return

    if (!rejectionData.reason.trim()) {
      setError('El motivo del rechazo es obligatorio')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await adminPaymentApi.rejectDeposit(deposit.id, {
        reason: rejectionData.reason.trim()
      })

      if (onRejected) {
        onRejected(result)
      }

      onClose()
    } catch (err) {
      console.error('Error rejecting deposit:', err)
      setError(err instanceof Error ? err.message : 'Error rechazando depósito')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    if (method.includes('BCP') || method.includes('BBVA') || method.includes('INTERBANK') || method.includes('SCOTIABANK')) {
      return '🏦'
    }
    if (method.includes('YAPE') || method.includes('PLIN')) {
      return '📱'
    }
    return '💳'
  }

  const commonRejectReasons = [
    'Comprobante de pago no válido',
    'Monto transferido no coincide',
    'Cuenta bancaria no coincide',
    'Transferencia no localizada en el banco',
    'Documento fraudulento o alterado',
    'Solicitud duplicada',
    'Usuario bloqueado o suspendido',
    'Información de KYC incompleta'
  ]

  if (!deposit) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={`max-w-2xl w-full mx-4 ${className}`}
      closeOnClickOutside={false}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`
          p-6 text-white
          ${action === 'approve' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : action === 'reject'
            ? 'bg-gradient-to-r from-red-500 to-red-600'
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }
        `}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {action === 'approve' ? '✅' : action === 'reject' ? '❌' : '🔍'}
            </span>
            <div>
              <h2 className="text-xl font-bold">
                {action === 'approve' 
                  ? 'Aprobar Depósito' 
                  : action === 'reject'
                  ? 'Rechazar Depósito'
                  : 'Validar Depósito'
                }
              </h2>
              <p className="text-blue-100 text-sm">
                {action === 'approve' 
                  ? 'Confirmar y acreditar Perlas al usuario' 
                  : action === 'reject'
                  ? 'Rechazar solicitud con motivo'
                  : 'Revisar detalles de la solicitud'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Deposit Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <span>📋</span>
              <span>Resumen de la Solicitud</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">Usuario:</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {deposit.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{deposit.user.fullName}</p>
                      <p className="text-sm text-gray-600">@{deposit.user.username}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600">Email:</label>
                  <p className="text-gray-800">{deposit.user.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600">Fecha de solicitud:</label>
                  <p className="text-gray-800">
                    {new Date(deposit.createdAt).toLocaleString('es-PE')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">Monto solicitado:</label>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(deposit.amount)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600">Perlas a acreditar:</label>
                  <p className="text-lg font-semibold text-yellow-600">
                    {deposit.pearlsAmount} Perlas
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600">Método de pago:</label>
                  <div className="flex items-center space-x-2">
                    <span>{getPaymentMethodIcon(deposit.paymentMethod)}</span>
                    <span className="font-medium text-gray-800">{deposit.paymentMethod}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600">Código de referencia:</label>
                  <p className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {deposit.referenceCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank account info */}
            {deposit.bankAccount && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Cuenta de origen del usuario:</h4>
                <div className="text-sm text-gray-700">
                  <p><strong>Cuenta:</strong> {deposit.bankAccount}</p>
                  {deposit.bankAccountName && (
                    <p><strong>Titular:</strong> {deposit.bankAccountName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Status and expiry */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <span className={`
                  px-3 py-1 text-sm font-semibold rounded-full
                  ${deposit.isExpired 
                    ? 'bg-red-100 text-red-700' 
                    : deposit.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                  }
                `}>
                  {deposit.isExpired ? '🕐 Expirado' : `📊 ${deposit.status}`}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {deposit.isExpired 
                  ? `Expiró: ${new Date(deposit.expiresAt).toLocaleString('es-PE')}`
                  : `Expira: ${deposit.timeRemaining}`
                }
              </div>
            </div>
          </div>

          {/* Proof Image */}
          {deposit.proofImage && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <span>📎</span>
                <span>Comprobante de Pago</span>
              </h4>
              <div className="bg-white rounded border p-2">
                <img 
                  src={deposit.proofImage} 
                  alt="Comprobante de pago"
                  className="max-w-full h-auto max-h-64 mx-auto rounded"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Haz clic en la imagen para ver en tamaño completo
              </p>
            </div>
          )}

          {/* Review Actions */}
          {action === 'review' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setAction('approve')}
                className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                size="lg"
                disabled={deposit.status !== 'PENDING'}
              >
                <span>✅</span>
                <span>Aprobar Depósito</span>
              </Button>

              <Button
                onClick={() => setAction('reject')}
                className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                size="lg"
                disabled={deposit.status !== 'PENDING'}
              >
                <span>❌</span>
                <span>Rechazar Depósito</span>
              </Button>
            </div>
          )}

          {/* Approval Form */}
          {action === 'approve' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-green-700 flex items-center space-x-2">
                <span>✅</span>
                <span>Datos para Aprobación</span>
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia bancaria * <span className="text-gray-500">(Código de operación del banco)</span>
                </label>
                <input
                  type="text"
                  value={approvalData.bankReference}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, bankReference: e.target.value }))}
                  placeholder="Ej: OP240112456789"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código de operación del banco que confirma la transferencia
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas administrativas <span className="text-gray-500">(Opcional)</span>
                </label>
                <textarea
                  value={approvalData.adminNotes}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Notas internas para el registro..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-800 mb-2">⚠️ Confirmación de Aprobación</h5>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Se acreditarán <strong>{deposit.pearlsAmount} Perlas</strong> al usuario</p>
                  <p>• El usuario recibirá una notificación automática</p>
                  <p>• Esta acción no se puede deshacer</p>
                  <p>• Administrador responsable: <strong>{user?.username}</strong></p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setAction('review')}
                  variant="outline"
                  className="flex-1 py-2"
                  disabled={loading}
                >
                  ← Atrás
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={!approvalData.bankReference.trim() || loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2"
                  size="lg"
                >
                  {loading ? 'Procesando...' : '✅ Confirmar Aprobación'}
                </Button>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-red-700 flex items-center space-x-2">
                <span>❌</span>
                <span>Motivo del Rechazo</span>
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona el motivo del rechazo *
                </label>
                <div className="space-y-2">
                  {commonRejectReasons.map((reason) => (
                    <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rejectReason"
                        value={reason}
                        checked={rejectionData.reason === reason}
                        onChange={(e) => setRejectionData(prev => ({ ...prev, reason: e.target.value }))}
                        className="text-red-500"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="custom"
                      checked={!commonRejectReasons.includes(rejectionData.reason) && rejectionData.reason !== ''}
                      onChange={() => setRejectionData(prev => ({ ...prev, reason: 'Otro motivo...' }))}
                      className="text-red-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Otro motivo (especificar abajo)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo detallado *
                </label>
                <textarea
                  value={rejectionData.reason}
                  onChange={(e) => setRejectionData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explica detalladamente el motivo del rechazo..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este mensaje será enviado al usuario para que pueda corregir y volver a solicitar
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-800 mb-2">⚠️ Confirmación de Rechazo</h5>
                <div className="text-sm text-red-700 space-y-1">
                  <p>• La solicitud será marcada como rechazada</p>
                  <p>• El usuario recibirá una notificación con el motivo</p>
                  <p>• No se acreditarán Perlas</p>
                  <p>• El usuario podrá crear una nueva solicitud si corrige el problema</p>
                  <p>• Administrador responsable: <strong>{user?.username}</strong></p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setAction('review')}
                  variant="outline"
                  className="flex-1 py-2"
                  disabled={loading}
                >
                  ← Atrás
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectionData.reason.trim() || loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2"
                  size="lg"
                >
                  {loading ? 'Procesando...' : '❌ Confirmar Rechazo'}
                </Button>
              </div>
            </div>
          )}

          {/* Read-only view for already processed deposits */}
          {deposit.status !== 'PENDING' && action === 'review' && (
            <div className="text-center py-4">
              <span className="text-lg">
                {deposit.status === 'APPROVED' ? '✅' : '❌'}
              </span>
              <p className="text-gray-600 mt-2">
                Esta solicitud ya ha sido procesada y se encuentra en estado: <strong>{deposit.status}</strong>
              </p>
              <Button
                onClick={onClose}
                className="mt-4 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default DepositValidationModal