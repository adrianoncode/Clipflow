const API_BASE = 'https://clipflow.to'

document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app')

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const pageUrl = tab?.url || ''
  const pageTitle = tab?.title || 'Untitled'

  // Check stored session
  const { clipflow_token, clipflow_workspaces, clipflow_api_base } =
    await chrome.storage.local.get(['clipflow_token', 'clipflow_workspaces', 'clipflow_api_base'])

  const apiBase = clipflow_api_base || API_BASE

  if (!clipflow_token) {
    app.innerHTML = `
      <div class="not-logged-in">
        <p>Sign in to Clipflow to save content</p>
        <button class="btn btn-primary" id="open-clipflow-btn">
          Open Clipflow
        </button>
        <br/><br/>
        <p style="font-size:11px;color:#555">After signing in, copy your token from<br>Settings → Extension and paste it here.</p>
        <br/>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <input
            id="token-input"
            type="password"
            placeholder="Paste token here…"
            style="flex:1;padding:8px 10px;background:#1a1a1a;border:1px solid #333;border-radius:6px;color:#e5e5e5;font-size:12px;"
          />
          <button class="btn btn-primary" id="save-token-btn" style="width:auto;padding:8px 12px;">Save</button>
        </div>
        <div id="token-status" style="margin-top:8px;font-size:11px;color:#666;"></div>
      </div>
    `

    document.getElementById('open-clipflow-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${apiBase}/settings/extension` })
    })

    document.getElementById('save-token-btn').addEventListener('click', async () => {
      const token = document.getElementById('token-input').value.trim()
      const statusEl = document.getElementById('token-status')
      if (!token) {
        statusEl.textContent = 'Please paste a token first.'
        return
      }

      statusEl.textContent = 'Verifying…'

      try {
        const res = await fetch(`${apiBase}/api/extension/auth`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (res.ok && data.ok) {
          await chrome.storage.local.set({
            clipflow_token: token,
            clipflow_workspaces: data.workspaces,
            clipflow_api_base: apiBase,
          })
          statusEl.textContent = 'Authenticated! Reloading…'
          setTimeout(() => location.reload(), 800)
        } else {
          statusEl.textContent = 'Invalid token. Please try again.'
        }
      } catch {
        statusEl.textContent = 'Could not connect to Clipflow.'
      }
    })

    return
  }

  const workspaces = clipflow_workspaces || []

  app.innerHTML = `
    <div class="content">
      <div class="label">Workspace</div>
      <select class="workspace-select" id="workspace-select">
        ${workspaces.map(w => `<option value="${escapeAttr(w.id)}">${escapeHtml(w.name)}</option>`).join('') || '<option value="">No workspaces</option>'}
      </select>
      <div class="label">Page</div>
      <div class="page-title" title="${escapeAttr(pageTitle)}">${escapeHtml(pageTitle)}</div>
      <div class="page-url" title="${escapeAttr(pageUrl)}">${escapeHtml(pageUrl)}</div>
      <button class="btn btn-primary" id="save-btn" ${!workspaces.length ? 'disabled' : ''}>
        Save to Clipflow
      </button>
      <button class="btn btn-secondary" id="open-btn">
        Open Clipflow
      </button>
      <button class="btn btn-secondary" id="logout-btn" style="margin-top:4px;color:#555;">
        Sign out
      </button>
      <div id="status"></div>
    </div>
  `

  document.getElementById('open-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: apiBase })
  })

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await chrome.storage.local.remove(['clipflow_token', 'clipflow_workspaces'])
    location.reload()
  })

  document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn')
    const status = document.getElementById('status')
    const workspaceId = document.getElementById('workspace-select').value

    if (!workspaceId) return

    btn.disabled = true
    btn.textContent = 'Saving…'

    try {
      const res = await fetch(`${apiBase}/api/extension/save-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clipflow_token}`
        },
        body: JSON.stringify({ url: pageUrl, title: pageTitle, workspaceId })
      })

      const data = await res.json()

      if (res.ok && data.ok) {
        status.className = 'status success'
        status.textContent = '✓ Saved! Opening in Clipflow…'
        setTimeout(() => {
          chrome.tabs.create({ url: `${apiBase}/workspace/${workspaceId}/content/${data.contentId}` })
        }, 1000)
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (err) {
      status.className = 'status error'
      status.textContent = '✗ ' + (err.message || 'Something went wrong')
      btn.disabled = false
      btn.textContent = 'Save to Clipflow'
    }
  })
})

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;')
}
