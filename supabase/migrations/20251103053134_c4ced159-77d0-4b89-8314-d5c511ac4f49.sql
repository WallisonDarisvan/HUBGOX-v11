-- Create link_lists table
CREATE TABLE public.link_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create list_items table
CREATE TABLE public.list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.link_lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.link_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for link_lists
CREATE POLICY "Users can view their own lists"
    ON public.link_lists
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own lists"
    ON public.link_lists
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lists"
    ON public.link_lists
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own lists"
    ON public.link_lists
    FOR DELETE
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view lists of their users"
    ON public.link_lists
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        (has_role(auth.uid(), 'admin') AND user_id IN (
            SELECT COALESCE(linked_profile_id, profile_id)
            FROM user_invitations
            WHERE invited_by_admin_id = auth.uid()
        ))
    );

CREATE POLICY "Admins can insert lists for their users"
    ON public.link_lists
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        (has_role(auth.uid(), 'admin') AND user_id IN (
            SELECT COALESCE(linked_profile_id, profile_id)
            FROM user_invitations
            WHERE invited_by_admin_id = auth.uid()
        ))
    );

CREATE POLICY "Admins can update lists of their users"
    ON public.link_lists
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        (has_role(auth.uid(), 'admin') AND user_id IN (
            SELECT COALESCE(linked_profile_id, profile_id)
            FROM user_invitations
            WHERE invited_by_admin_id = auth.uid()
        ))
    )
    WITH CHECK (
        user_id = auth.uid() OR
        (has_role(auth.uid(), 'admin') AND user_id IN (
            SELECT COALESCE(linked_profile_id, profile_id)
            FROM user_invitations
            WHERE invited_by_admin_id = auth.uid()
        ))
    );

CREATE POLICY "Admins can delete lists of their users"
    ON public.link_lists
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        (has_role(auth.uid(), 'admin') AND user_id IN (
            SELECT COALESCE(linked_profile_id, profile_id)
            FROM user_invitations
            WHERE invited_by_admin_id = auth.uid()
        ))
    );

-- RLS Policies for list_items
CREATE POLICY "Users can manage items of their own lists"
    ON public.list_items
    FOR ALL
    USING (
        list_id IN (
            SELECT id FROM public.link_lists WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        list_id IN (
            SELECT id FROM public.link_lists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage items of their users' lists"
    ON public.list_items
    FOR ALL
    USING (
        has_role(auth.uid(), 'admin') AND list_id IN (
            SELECT ll.id
            FROM link_lists ll
            JOIN user_invitations ui ON (ui.profile_id = ll.user_id OR ui.linked_profile_id = ll.user_id)
            WHERE ui.invited_by_admin_id = auth.uid()
        )
    )
    WITH CHECK (
        has_role(auth.uid(), 'admin') AND list_id IN (
            SELECT ll.id
            FROM link_lists ll
            JOIN user_invitations ui ON (ui.profile_id = ll.user_id OR ui.linked_profile_id = ll.user_id)
            WHERE ui.invited_by_admin_id = auth.uid()
        )
    );

-- Trigger for updated_at on link_lists
CREATE TRIGGER update_link_lists_updated_at
    BEFORE UPDATE ON public.link_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on list_items
CREATE TRIGGER update_list_items_updated_at
    BEFORE UPDATE ON public.list_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_link_lists_user_id ON public.link_lists(user_id);
CREATE INDEX idx_list_items_list_id ON public.list_items(list_id);
CREATE INDEX idx_list_items_display_order ON public.list_items(list_id, display_order);