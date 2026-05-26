using System;

namespace Repositories.Entities;

public class Regulation : BaseEntity
{
    /// <summary>The regulation text content.</summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>Display order index (lower = displayed first).</summary>
    public int OrderIndex { get; set; }

    /// <summary>Whether this regulation is currently active/visible.</summary>
    public bool IsActive { get; set; } = true;
}
