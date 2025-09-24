document.addEventListener('DOMContentLoaded', () => {
    // Load saved summary when panel opens
    chrome.storage.local.get(['summarizedResult'], function (result) {
        if (result.summarizedResult) {
            showResult(result.summarizedResult);
        }
    });

    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('saveNotesBtn').addEventListener('click', saveSummary);
    document.getElementById('clearSummaryBtn').addEventListener('click', clearSummary); // ✅ NEW
});

async function summarizeText() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('Please select some text first');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: 'summarize' })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        const formatted = text.replace(/\n/g, '<br>');
        showResult(formatted);

    } catch (error) {
        showResult(`Error: ${error.message}`);
    }
}

async function saveSummary() {
    const summary = document.getElementById('results').innerText.trim();

    if (!summary || summary.includes('Please select some text')) {
        alert('No summary to save yet.');
        return;
    }

    // Save in storage
    chrome.storage.local.set({ summarizedResult: summary }, function () {
        // Copy to clipboard
        navigator.clipboard.writeText(summary).then(() => {
            alert('Summary saved & copied to clipboard');
        }).catch(err => {
            alert('Summary saved, but failed to copy: ' + err);
        });
    });
}

async function clearSummary() {
    chrome.storage.local.remove('summarizedResult', function () {
        document.getElementById('results').innerHTML =
            'Select text and click "Summarize Text" to get started...';
        alert('Summary cleared');
    });
}

function showResult(content) {
    document.getElementById('results').innerHTML =
        `<div class="result-time">
            <div class="result-content">
                ${content}
            </div>
        </div>`;
}
