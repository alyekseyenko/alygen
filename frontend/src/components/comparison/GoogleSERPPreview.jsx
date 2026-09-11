export default function GoogleSERPPreview({ 
  position = 15, 
  title = "Empresa Exemplo", 
  url = "exemplo.pt",
  description = "Descrição do site...",
  type = "before",
  notInTop50 = false,
  isProjection = false
}) {
  const isAfter = type === "after"
  
  return (
    <div className="bg-white p-6 rounded-lg min-h-[500px]">
      {/* Google Search Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-8 h-8" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
            <path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
            <path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
            <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>
            <path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
          </svg>
          <div style={{ flex: 1, height: '40px', border: '2px solid #e5e7eb', borderRadius: '9999px', padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
            imobiliária lisboa
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        {/* Mensagem se não aparece no TOP 50 */}
        {!isAfter && notInTop50 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 font-bold text-sm">ATENÇÃO</span>
            </div>
            <p className="text-sm text-red-800 font-medium mb-1">
              Seu site não aparece nas 2 primeiras páginas do Google
            </p>
            <p className="text-xs text-red-700">
              Isso significa que potenciais clientes não conseguem encontrar você facilmente. 90% dos cliques ficam nas 2 primeiras páginas.
            </p>
          </div>
        )}
        
        {/* Anúncios (se after) */}
        {isAfter && (
          <>
            <div className="border-l-4 border-yellow-400 pl-3 py-2 bg-yellow-50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-700">Anúncio</span>
              </div>
              <h3 className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                Concorrente 1 - Imobiliária Premium
              </h3>
              <p className="text-xs text-green-700">www.concorrente1.pt</p>
              <p className="text-xs text-gray-600 mt-1">Apartamentos de luxo em Lisboa...</p>
            </div>
            <div className="border-l-4 border-yellow-400 pl-3 py-2 bg-yellow-50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-700">Anúncio</span>
              </div>
              <h3 className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                Concorrente 2 - Casas em Lisboa
              </h3>
              <p className="text-xs text-green-700">www.concorrente2.pt</p>
              <p className="text-xs text-gray-600 mt-1">Encontre a casa dos seus sonhos...</p>
            </div>
          </>
        )}

        {/* Resultados Orgânicos */}
        {!notInTop50 && Array.from({ length: isAfter ? 3 : 5 }).map((_, i) => {
          const currentPosition = i + 1
          const isYourSite = isAfter ? currentPosition === 3 : currentPosition === position
          
          return (
            <div 
              key={i} 
              className={`py-2 ${isYourSite ? 'bg-accent/10 border-l-4 border-accent pl-3 -ml-3' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isYourSite && (
                  <span className="text-xs font-bold text-accent">← VOCÊ ESTÁ AQUI</span>
                )}
              </div>
              <h3 className={`text-lg font-medium hover:underline cursor-pointer ${
                isYourSite ? 'text-accent' : 'text-blue-600'
              }`}>
                {isYourSite ? title : `Concorrente ${currentPosition} - Imobiliária`}
              </h3>
              <p className="text-sm text-green-700">
                {isYourSite ? url : `www.concorrente${currentPosition}.pt`}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {isYourSite 
                  ? description 
                  : `Descrição do concorrente ${currentPosition}. Apartamentos e moradias em Lisboa...`
                }
              </p>
            </div>
          )
        })}
        
        {/* Mensagem "Fora do TOP 50" */}
        {!isAfter && notInTop50 && (
          <div className="text-center py-12">
            <div className="text-gray-300 mb-6">
              <p className="text-lg font-medium mb-2">2 Primeiras Páginas do Google (TOP 20)</p>
              <div className="space-y-1 mb-4">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="h-6 bg-gray-100 rounded"></div>
                ))}
                <p className="text-xs my-2">... Página 2 ...</p>
                {[11,12,13,14,15,16,17,18,19,20].map(i => (
                  <div key={i} className="h-6 bg-gray-50 rounded"></div>
                ))}
              </div>
              <p className="text-sm">... seu site não aparece aqui ...</p>
            </div>
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-600 font-bold mb-2">Seu site está fora das 2 primeiras páginas</p>
              <h3 className="text-lg font-medium text-red-700 mb-1">{title}</h3>
              <p className="text-sm text-green-700">{url}</p>
              <p className="text-xs text-red-600 mt-2">
                {position ? `Posição atual: #${position}` : 'Posição estimada: Além do TOP 20'}
              </p>
            </div>
          </div>
        )}

        {/* Mensagem se está muito abaixo (mas dentro do TOP 50) */}
        {!isAfter && !notInTop50 && position > 5 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">... mais {position - 5} resultados ...</p>
            <div className="mt-4 py-2 bg-red-50 border-l-4 border-red-500 pl-3">
              <h3 className="text-lg font-medium text-red-600">
                {title}
              </h3>
              <p className="text-sm text-green-700">{url}</p>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Página 1 de resultados</span>
        </div>
        <div className="text-xs font-bold">
          {isAfter && isProjection && (
            <span className="text-accent">Projeção Após Otimização</span>
          )}
          {isAfter && !isProjection && (
            <span className="text-gray-600">Após Otimização SEO</span>
          )}
          {!isAfter && notInTop50 && (
            <span className="text-red-600">Não aparece nas 2 primeiras páginas</span>
          )}
          {!isAfter && !notInTop50 && (
            <span className="text-gray-400">Estado Atual</span>
          )}
        </div>
      </div>
    </div>
  )
}
