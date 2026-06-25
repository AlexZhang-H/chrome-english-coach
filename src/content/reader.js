(() => {
  function pickRoot() {
    return (
      document.querySelector('article') ||
      document.querySelector('main') ||
      document.body
    );
  }

  function extract() {
    const root = pickRoot();
    const title =
      document.querySelector('h1')?.innerText?.trim() ||
      document.title ||
      '';
    const paragraphs = Array.from(root.querySelectorAll('p, h2, h3, li'))
      .map((el) => el.innerText.trim())
      .filter((t) => t.length > 0);
    return {
      title,
      url: location.href,
      textContent: paragraphs.join('\n\n'),
    };
  }

  return extract();
})();
