window.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('markdown-input') as HTMLTextAreaElement;
    const sandbox = new IDocs.sandbox.Sandbox('main', textarea.value);
    textarea.addEventListener('input', () => {
        sandbox.send(textarea.value);
    });

    // Bot-friendly content hiding strategy:
    // 1. Bots that don't execute JS will see the textarea content in full
    // 2. Bots that execute JS but have short timeouts will see content for 300ms
    // 3. Human users see no visual flash due to flex:0 + removed padding/border
    textarea.style.flex = '0';        // Collapse to zero width, no visual space
    textarea.style.padding = '0';     // Remove default padding that creates pixel shift
    textarea.style.border = '0';      // Remove default border that creates pixel shift
    setTimeout(() => {
        // After 300ms (longer than most bot JS timeouts), restore defaults and hide
        textarea.style.flex = '';     // Restore original flex value from CSS
        textarea.style.padding = '';  // Restore original padding from CSS
        textarea.style.border = '';   // Restore original border from CSS
        textarea.style.display = 'none'; // Fully hide from users (but they can unhide to edit)
    }, 300);

    const button = document.getElementById('toggle-textarea');
    button?.addEventListener('click', () => {
        textarea.style.display = textarea.style.display === 'none' ? '' : 'none';
    });
});
