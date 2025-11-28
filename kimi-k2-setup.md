# Kimi K2 Setup for KiloCode

## Quick Setup Instructions

1. **Open VS Code Command Palette**: `Ctrl+Shift+P`

2. **Select**: `Preferences: Open Settings (JSON)`

3. **Add this configuration** (inside the existing `{}` braces):

```jsonc
{
  // ... your other settings ...
  "kilo-code.model": "kimi-k2-0905-preview",
  "kilo-code.provider": "openai-compatible",
  "kilo-code.openaiBaseUrl": "https://api.moonshot.ai/v1",
  "kilo-code.openaiApiKey": "sk-kimi-9Gg4oCoDVAsub2skpTcWdtVESV7NkWxyr5pqOacpcvxFuHJq5ZLHU1dBG1IixGEN"
}
```

4. **Save the file**: `Ctrl+S`

5. **Reload Window**: Command Palette → `Developer: Reload Window`

6. **Start a new KiloCode thread** - you'll now use Kimi K2 instead of GPT-4o

## Notes
- Make sure each setting line (except the last) ends with a comma
- This will consume your Moderato quota instead of GPT-4o quota
- Alternative model option: `kimi-for-coding`
